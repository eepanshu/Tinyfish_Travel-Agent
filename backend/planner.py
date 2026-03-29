import os
import json
from groq import Groq
from dotenv import load_dotenv
from schemas import TripRequest, AgentTask

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def plan_tasks(request: TripRequest) -> list[AgentTask]:
    # Use a regular string with concatenation to avoid ALL f-string / format() curly brace issues
    prompt = "You are a travel task planner. Convert this trip request into a list of specific web agent tasks.\n"
    prompt += "Request: " + request.origin + " to " + request.destination + " from " + request.start_date + " to " + request.end_date + " with a budget of $" + str(request.budget) + ".\n\n"
    prompt += "Tasks should include:\n"
    prompt += "1. Searching for flights on Skyscanner or Google Flights. THE AGENT MUST RETURN A FINAL SUMMARY with the airline name and total price for the best 3 options in JSON-like structure.\n"
    prompt += "2. Searching for hotels on Booking.com or similar. THE AGENT MUST RETURN A FINAL SUMMARY with the hotel name and price per night in JSON-like structure.\n"
    prompt += "3. Generating a 3-day itinerary based on the destination.\n\n"
    prompt += "Respond ONLY with a JSON array of objects, each with 'id', 'task', and 'url' fields.\n"
    prompt += "Example: [{\"id\": 1, \"task\": \"Search for flights from Delhi to Dubai on April 12. Return the top 3 flight options with prices and airlines in your final response.\", \"url\": \"https://www.skyscanner.com\"}]"
    
    print("Groq Prompt:")
    print(prompt)
    
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
    )
    
    content = completion.choices[0].message.content
    print("Groq Response:")
    print(content)
    
    try:
        # Extract JSON if LLM includes fluff
        json_start = content.find("[")
        json_end = content.rfind("]") + 1
        tasks_data = json.loads(content[json_start:json_end])
        return [AgentTask(**t) for t in tasks_data]
    except Exception as e:
        print(f"Error parsing tasks: {e}")
        return [
            AgentTask(id=1, task=f"Search flights from {request.origin} to {request.destination}"),
            AgentTask(id=2, task=f"Search hotels in {request.destination}"),
            AgentTask(id=3, task=f"Build itinerary for {request.destination}")
        ]
