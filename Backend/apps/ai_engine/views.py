import os
import json
import re
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

# AI Engine Configuration
def call_ai_engine(prompt):
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    
    if gemini_api_key:
        # Use Google Gemini API (high reliability, low memory usage in production)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key={gemini_api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                data = response.json()
                try:
                    return data['candidates'][0]['content']['parts'][0]['text']
                except (KeyError, IndexError):
                    raise Exception(f"Unexpected response format from Gemini API: {data}")
            else:
                raise Exception(f"Gemini API Error {response.status_code}: {response.text}")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Gemini API Connection Error: {str(e)}")
            
    else:
        # Fall back to local Ollama Configuration for offline local development
        OLLAMA_API_URL = "http://localhost:11434/api/generate"
        MODEL_NAME = "gemma:2b"
        payload = {
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": 800,
                "temperature": 0.5
            }
        }
        try:
            response = requests.post(OLLAMA_API_URL, json=payload, timeout=180) # Local LLMs can be slow
            if response.status_code == 200:
                data = response.json()
                return data.get('response', '')
            else:
                raise Exception(f"Ollama API Error {response.status_code}: {response.text}")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Ollama Connection Error: {str(e)}. Make sure Ollama is running.")

def extract_json_list(text):
    try:
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if match: return json.loads(match.group(0))
        return []
    except: return []

class AIGeneratorView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        topic_title = request.data.get('topic_title', 'General')
        custom_prompt = request.data.get('custom_prompt', '')
        prompt = f"Topic: {topic_title}. Instruction: {custom_prompt}. Generate professional academic content in Markdown."
        
        try:
            content = call_ai_engine(prompt)
            return Response({'content': content})
        except Exception as e:
            # SHOWN THE REAL ERROR - NO MORE MOCK DATA
            return Response({'error': str(e)}, status=500)

class AISequenceView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        topics = request.data.get('topics', [])
        topic_titles = [t.get('title', str(t)) for t in topics]
        prompt = f"Sequence these topics logically: {topic_titles}. Return ONLY a JSON list of titles."
        try:
            content = call_ai_engine(prompt)
            suggested_titles = extract_json_list(content)
            sorted_topics = []
            for title in (suggested_titles or []):
                match = next((t for t in topics if t.get('title') == title), None)
                if match: sorted_topics.append(match)
            return Response({'suggested_sequence': sorted_topics if sorted_topics else topics, 'explanation': "AI Sequence Optimized."})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class AIGapAnalysisView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        topics = request.data.get('topics', [])
        topic_titles = [t.get('title', str(t)) for t in topics]
        prompt = f"Find 3 missing topics in: {topic_titles}. Return ONLY JSON [{{topic, reason}}]."
        try:
            content = call_ai_engine(prompt)
            gaps = extract_json_list(content)
            return Response({'gaps_identified': gaps, 'summary': "Gap Scan Complete."})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class AIBenchmarkView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        topics = request.data.get('topics', [])
        standard_syllabus = request.data.get('standard_syllabus', '')
        topic_titles = [t.get('title', str(t)) for t in topics]
        
        prompt = f"Compare these current curriculum topics: {topic_titles} with this standard syllabus: '{standard_syllabus}'. Identify missing areas and suggest improvements. Return ONLY JSON [{{topic, gap, suggestion}}]."
        try:
            content = call_ai_engine(prompt)
            
            if not content:
                return Response({'error': "AI returned an empty response. Please try again."}, status=500)
                
            comparison = extract_json_list(content)
            
            if not comparison:
                comparison = [{
                    'topic': 'Comparison Summary', 
                    'gap': 'The AI did not return a structured list. Here is the raw analysis:', 
                    'suggestion': content
                }]
                
            return Response({'comparison': comparison, 'summary': "Benchmark Complete."})
        except Exception as e:
            return Response({'error': str(e)}, status=500)
