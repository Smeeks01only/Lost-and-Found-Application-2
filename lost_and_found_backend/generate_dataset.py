import json
import random
import uuid
from datetime import datetime, timedelta

def generate_dataset():
    categories = [
        'BAG', 'PHONE', 'WALLET', 'KEYS', 'LAPTOP', 'CLOTHING', 'JEWELRY', 
        'DOCUMENTS', 'ELECTRONICS', 'GLASSES', 'HEADPHONES', 'UMBRELLA', 
        'BOOKS', 'SPORTS', 'OTHER'
    ]
    
    locations = [
        'Library Main Hall', 'Cafeteria near Window', 'Physics Building Room 301', 
        'Student Union Lounge', 'Campus Gym lockers', 'North Parking Lot', 
        'Lecture Hall A', 'Bus Stop outside Main Gate', 'Computer Lab 2'
    ]
    
    base_date = datetime.now() - timedelta(days=15)
    
    # 40 matching pairs
    matching_pairs_data = [
        ("MacBook Air M1 Silver", "Silver Apple laptop, M1 2020", "LAPTOP"),
        ("iPhone 13 Pro Blue", "Blue iPhone 3 cameras", "PHONE"),
        ("Jansport Black Backpack", "Black rucksack Jansport brand", "BAG"),
        ("Ray-Ban Aviators", "Gold rimmed aviator sunglasses", "GLASSES"),
        ("Apple AirPods Pro", "White wireless earbuds in case", "HEADPHONES"),
        ("Brown Leather Wallet", "Bifold wallet brown leather", "WALLET"),
        ("Keys with Honda fob", "Car keys with red lanyard", "KEYS"),
        ("Hydroflask blue 32oz", "Blue water bottle", "OTHER"),
        ("Sony WH-1000XM4 Black", "Sony noise cancelling headphones black", "HEADPHONES"),
        ("Dell XPS 15", "Dell laptop silver carbon fiber", "LAPTOP"),
        ("North Face Black Jacket", "Black rain jacket North Face", "CLOTHING"),
        ("Gold necklace with cross", "Thin gold chain cross pendant", "JEWELRY"),
        ("Student ID John Doe", "ID card for John", "DOCUMENTS"),
        ("Calculus Textbook 8th ed", "Math book heavy", "BOOKS"),
        ("Basketball Spalding", "Orange basketball", "SPORTS"),
        ("Umbrella black folding", "Small black umbrella", "UMBRELLA"),
        ("Samsung Galaxy S22", "Samsung phone black with clear case", "PHONE"),
        ("Nike Gym Bag", "Blue duffel bag Nike", "BAG"),
        ("Herschel grey backpack", "Grey canvas backpack", "BAG"),
        ("Apple Watch Series 7", "Smartwatch black band", "ELECTRONICS"),
        ("iPad Pro 11 inch", "Tablet with apple pencil", "ELECTRONICS"),
        ("Gucci sunglasses", "Designer sunglasses black", "GLASSES"),
        ("Bose SoundLink speaker", "Small bluetooth speaker black", "ELECTRONICS"),
        ("Yeti Rambler pink", "Pink thermos Yeti", "OTHER"),
        ("Vans black and white sneakers", "Skate shoes size 10", "CLOTHING"),
        ("Silver hoop earrings", "Small silver hoops", "JEWELRY"),
        ("Passport Jane Smith", "US Passport", "DOCUMENTS"),
        ("Moleskine notebook black", "Black leather journal", "BOOKS"),
        ("Tennis racket Wilson", "Blue and white tennis racket", "SPORTS"),
        ("Red scarf wool", "Winter scarf red", "CLOTHING"),
        ("Car keys Toyota", "Toyota fob with house keys", "KEYS"),
        ("Louis Vuitton wallet", "Designer wallet brown", "WALLET"),
        ("Kindle Paperwhite", "E-reader black", "ELECTRONICS"),
        ("Lenovo ThinkPad", "Black business laptop", "LAPTOP"),
        ("Google Pixel 6", "Pixel phone green", "PHONE"),
        ("Beats Studio Buds", "Red wireless earbuds", "HEADPHONES"),
        ("Swiss Army Knife", "Pocket knife red", "OTHER"),
        ("Lululemon yoga mat", "Purple yoga mat", "SPORTS"),
        ("Patagonia fleece", "Blue fleece pullover", "CLOTHING"),
        ("Casio G-Shock", "Black digital watch G-shock", "JEWELRY")
    ]
    
    lost_items = []
    found_items = []
    ground_truth_pairs = []

    # Generate the 40 matching pairs
    for i, (lost_desc, found_desc, category) in enumerate(matching_pairs_data):
        date_lost = base_date + timedelta(days=random.randint(0, 10))
        date_found = date_lost + timedelta(days=random.randint(0, 3))
        loc = random.choice(locations)
        
        lost_items.append({
            "title": f"Lost {lost_desc}",
            "description": lost_desc,
            "category": category,
            "location_lost": loc,
            "date_lost": date_lost.strftime('%Y-%m-%d')
        })
        
        found_items.append({
            "title": f"Found {found_desc}",
            "description": found_desc,
            "category": category,
            "location_found": loc,  # Same location for matching pairs
            "date_found": date_found.strftime('%Y-%m-%d'),
            "secret_question": "What is inside?",
            "secret_answer": "Nothing"
        })
        
        ground_truth_pairs.append({
            "lost_index": i,
            "found_index": i
        })

    # Generate 25 unmatched lost items
    for i in range(25):
        cat = random.choice(categories)
        lost_items.append({
            "title": f"Lost Unmatched {cat} {i}",
            "description": f"I lost my {cat.lower()} somewhere around here.",
            "category": cat,
            "location_lost": random.choice(locations),
            "date_lost": (base_date + timedelta(days=random.randint(0, 10))).strftime('%Y-%m-%d')
        })

    # Generate 25 unmatched found items
    for i in range(25):
        cat = random.choice(categories)
        found_items.append({
            "title": f"Found Unmatched {cat} {i}",
            "description": f"Found this {cat.lower()} lying around.",
            "category": cat,
            "location_found": random.choice(locations),
            "date_found": (base_date + timedelta(days=random.randint(0, 10))).strftime('%Y-%m-%d'),
            "secret_question": "What is the brand?",
            "secret_answer": "Generic"
        })

    dataset = {
        "lost_items": lost_items,
        "found_items": found_items,
        "ground_truth_pairs": ground_truth_pairs
    }
    
    with open('synthetic_data/synthetic_dataset.json', 'w') as f:
        json.dump(dataset, f, indent=2)

    print("Dataset generated successfully at synthetic_data/synthetic_dataset.json")

if __name__ == "__main__":
    generate_dataset()
