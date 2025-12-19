import requests
import json

# Test the API endpoint
url = "http://localhost:8000/api/topics/"

# Test without authentication first
print("=" * 60)
print("Testing GET /api/topics/ endpoint")
print("=" * 60)

try:
    response = requests.get(url)
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Total topics: {data.get('count', 0)}\n")
        
        for topic in data.get('topics', []):
            print(f"📚 Topic {topic['order']}: {topic['name']}")
            print(f"   Questions in DB: {topic.get('question_count', 0)}")
            print(f"   Completed: {topic.get('completed_count', 0)}/10")
            print(f"   Completion: {topic.get('completion_percentage', 0)}%")
            print(f"   Status: {'🔒 LOCKED' if topic.get('is_locked') else '🔓 UNLOCKED'}")
            print()
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Error connecting to API: {e}")
    print("\nMake sure the Django server is running on http://localhost:8000")

print("=" * 60)
print("\n✅ API test completed!")
print("\nNOTE: To see user-specific progress, you need to:")
print("1. Login to the app")
print("2. Complete some questions")
print("3. Check the topics list again")