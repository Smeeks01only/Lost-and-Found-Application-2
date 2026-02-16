"""
Match and Claim Views for the matching and verification workflow.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from .models import Match, Claim, MatchStatus, ClaimStatus
from .serializers import (
    MatchSerializer,
    MatchListSerializer,
    ClaimSerializer,
    ClaimSubmitSerializer,
    ClaimReviewSerializer
)
from items.models import LostItemStatus, FoundItemStatus


class IsStaffUser(permissions.BasePermission):
    """Permission to allow staff and admin users."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_staff_permissions()


class MatchViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing matches.
    
    Users can see matches for their lost items.
    Staff can see all matches.
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.has_staff_permissions():
            return Match.objects.all()
        return Match.objects.filter(lost_item__user=user)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return MatchListSerializer
        return MatchSerializer
    
    @action(detail=True, methods=['post'])
    def claim(self, request, pk=None):
        """Submit a claim for this match."""
        match = self.get_object()
        
        # Check for existing claim first
        existing_claim = Claim.objects.filter(
            match=match,
            claimant=request.user
        ).first()
        
        # Validate match is claimable (allow if POTENTIAL or if there's an existing claim with retries left)
        if match.status != MatchStatus.POTENTIAL and match.status != MatchStatus.CLAIMED:
            return Response(
                {'error': 'This match is no longer available for claiming'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # If match is CLAIMED, only allow if it's from the same user's pending claim
        if match.status == MatchStatus.CLAIMED:
            if not existing_claim or existing_claim.status != ClaimStatus.PENDING:
                return Response(
                    {'error': 'This match is no longer available for claiming'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Validate user owns the lost item
        if match.lost_item.user != request.user:
            return Response(
                {'error': 'You can only claim matches for your own lost items'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if existing_claim and existing_claim.attempt_count >= 3:
            return Response(
                {'error': 'Maximum claim attempts reached for this item'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ClaimSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Verify secret answer
        secret_answer = serializer.validated_data['secret_answer']
        is_correct = match.found_item.check_secret_answer(secret_answer)
        
        if existing_claim:
            # Update existing claim
            existing_claim.attempt_count += 1
            existing_claim.is_correct_answer = is_correct
            existing_claim.secret_answer_provided = secret_answer
            existing_claim.additional_proof = serializer.validated_data.get('additional_proof', '')
            if 'proof_image' in serializer.validated_data:
                existing_claim.proof_image = serializer.validated_data['proof_image']
            existing_claim.save()
            claim = existing_claim
        else:
            # Create new claim
            claim = Claim.objects.create(
                match=match,
                claimant=request.user,
                secret_answer_provided=secret_answer,
                is_correct_answer=is_correct,
                additional_proof=serializer.validated_data.get('additional_proof', ''),
                status=ClaimStatus.PENDING
            )
            if 'proof_image' in serializer.validated_data:
                claim.proof_image = serializer.validated_data['proof_image']
                claim.save()
        
        # Only update match status to CLAIMED when there's an active claim
        if match.status == MatchStatus.POTENTIAL:
            match.status = MatchStatus.CLAIMED
            match.save()
        
        response_data = {
            'claim_id': str(claim.id),
            'is_correct_answer': is_correct,
            'attempt_count': claim.attempt_count,
            'status': claim.status,
        }
        
        if is_correct:
            response_data['message'] = 'Secret answer correct! Please proceed to the Lost & Found office to collect your item.'
        else:
            response_data['message'] = 'Incorrect answer. Please try again.'
            response_data['attempts_remaining'] = 3 - claim.attempt_count
        
        return Response(response_data, status=status.HTTP_201_CREATED)


class ClaimViewSet(viewsets.ModelViewSet):
    """
    ViewSet for claims.
    
    Users can see their own claims.
    Admins can review and approve/reject claims.
    """
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ClaimSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.has_staff_permissions():
            return Claim.objects.all()
        return Claim.objects.filter(claimant=user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def review(self, request, pk=None):
        """Admin review of a claim."""
        claim = self.get_object()
        
        serializer = ClaimReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        claim.status = serializer.validated_data['status']
        claim.admin_notes = serializer.validated_data.get('admin_notes', '')
        claim.reviewed_by = request.user
        claim.reviewed_at = timezone.now()
        claim.save()
        
        # Update related statuses if approved
        if claim.status == ClaimStatus.APPROVED:
            claim.match.status = MatchStatus.VERIFIED
            claim.match.save()
            
            claim.match.lost_item.status = LostItemStatus.CLAIMED
            claim.match.lost_item.is_active = False
            claim.match.lost_item.save()
            
            claim.match.found_item.status = FoundItemStatus.RETURNED
            claim.match.found_item.save()
        
        elif claim.status == ClaimStatus.REJECTED:
            claim.match.status = MatchStatus.REJECTED
            claim.match.save()
        
        return Response({
            'message': f'Claim {claim.status.lower()}',
            'claim': ClaimSerializer(claim).data
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsStaffUser])
    def pending(self, request):
        """Get all pending claims for admin review."""
        pending_claims = Claim.objects.filter(status=ClaimStatus.PENDING)
        serializer = ClaimSerializer(pending_claims, many=True)
        return Response(serializer.data)
