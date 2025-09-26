#!/usr/bin/env python3
"""
Meeting Task Generator Web Application
A Flask-based frontend for the CrewAI Meeting Task Generator
"""

from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import sys
from datetime import datetime
import json

# Add the src directory to the path so we can import our crew
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from my_project.crew import MyProject

app = Flask(__name__)

@app.route('/')
def index():
    """Main page with the meeting task generator form"""
    return render_template('index.html')

@app.route('/generate_tasks', methods=['POST'])
def generate_tasks():
    """Generate action items from meeting notes"""
    try:
        # Get form data
        meeting_goal = request.json.get('meeting_goal', '')
        meeting_notes = request.json.get('meeting_notes', '')
        
        if not meeting_goal or not meeting_notes:
            return jsonify({
                'success': False,
                'error': 'Both meeting goal and notes are required'
            }), 400
        
        # Create crew and run task generation
        crew = MyProject().crew()
        
        # Prepare inputs
        inputs = {
            'meeting_goal': meeting_goal,
            'meeting_notes': meeting_notes
        }
        
        # Run the crew
        result = crew.kickoff(inputs=inputs)
        
        # Parse the result to extract action items
        action_items = parse_action_items(str(result))
        
        return jsonify({
            'success': True,
            'action_items': action_items,
            'raw_result': str(result)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'An error occurred: {str(e)}'
        }), 500

def parse_action_items(result_text):
    """Parse action items from the crew result"""
    action_items = []
    
    # Look for the action items section
    lines = result_text.split('\n')
    in_action_items = False
    
    for line in lines:
        line = line.strip()
        
        # Check if we're in the action items section
        if 'Action Items:' in line:
            in_action_items = True
            continue
            
        # If we're in action items and line starts with a number
        if in_action_items and line and (line[0].isdigit() or line.startswith('**')):
            # Clean up the line
            if line.startswith('**'):
                # Remove markdown formatting
                line = line.replace('**', '').replace('*', '')
            
            # Extract team, task, and deadline
            if '→' in line:
                parts = line.split('→')
                if len(parts) == 2:
                    team_part = parts[0].strip()
                    task_part = parts[1].strip()
                    
                    # Extract deadline
                    deadline = None
                    if '(Deadline:' in task_part:
                        deadline_start = task_part.find('(Deadline:')
                        deadline_end = task_part.find(')', deadline_start)
                        if deadline_end > deadline_start:
                            deadline = task_part[deadline_start + 11:deadline_end].strip()
                            task_part = task_part[:deadline_start].strip()
                    
                    action_items.append({
                        'team': team_part,
                        'task': task_part,
                        'deadline': deadline or 'Not specified'
                    })
    
    return action_items

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

if __name__ == '__main__':
    # Create templates and static directories if they don't exist
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    
    print("🚀 Starting Meeting Task Generator Web App...")
    print("📱 Open your browser and go to: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)