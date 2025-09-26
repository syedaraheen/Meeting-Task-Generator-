// Meeting Task Generator JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('meetingForm');
    const generateBtn = document.getElementById('generateBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultsContainer = document.getElementById('resultsContainer');
    const actionItems = document.getElementById('actionItems');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const copyBtn = document.getElementById('copyBtn');
    const successToast = document.getElementById('successToast');
    const copyToast = document.getElementById('copyToast');

    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const meetingGoal = document.getElementById('meetingGoal').value.trim();
        const meetingNotes = document.getElementById('meetingNotes').value.trim();
        
        if (!meetingGoal || !meetingNotes) {
            showError('Please fill in both meeting goal and notes.');
            return;
        }
        
        await generateActionItems(meetingGoal, meetingNotes);
    });

    // Generate action items function
    async function generateActionItems(goal, notes) {
        try {
            // Show loading state
            setLoadingState(true);
            hideError();
            hideResults();
            
            // Make API request
            const response = await fetch('/generate_tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    meeting_goal: goal,
                    meeting_notes: notes
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                displayActionItems(data.action_items);
                showSuccessToast();
            } else {
                showError(data.error || 'An error occurred while generating action items.');
            }
            
        } catch (error) {
            console.error('Error:', error);
            showError('Network error. Please check your connection and try again.');
        } finally {
            setLoadingState(false);
        }
    }

    // Display action items
    function displayActionItems(items) {
        if (!items || items.length === 0) {
            showError('No action items were generated. Please try again with different input.');
            return;
        }
        
        actionItems.innerHTML = '';
        
        items.forEach((item, index) => {
            const actionItem = createActionItemElement(item, index + 1);
            actionItems.appendChild(actionItem);
        });
        
        showResults();
    }

    // Create action item element
    function createActionItemElement(item, number) {
        const div = document.createElement('div');
        div.className = 'action-item';
        
        // Add team-specific class for styling
        const teamClass = getTeamClass(item.team);
        if (teamClass) {
            div.classList.add(teamClass);
        }
        
        div.innerHTML = `
            <div class="action-item-header">
                <div class="action-item-number">${number}</div>
                <div class="action-item-team">${item.team}</div>
            </div>
            <div class="action-item-task">${item.task}</div>
            <div class="action-item-deadline">
                <i class="fas fa-clock"></i>
                <span>Deadline: ${item.deadline}</span>
            </div>
        `;
        
        return div;
    }

    // Get team class for styling
    function getTeamClass(team) {
        const teamLower = team.toLowerCase();
        if (teamLower.includes('marketing')) return 'team-marketing';
        if (teamLower.includes('engineering')) return 'team-engineering';
        if (teamLower.includes('legal')) return 'team-legal';
        if (teamLower.includes('sales')) return 'team-sales';
        if (teamLower.includes('design')) return 'team-design';
        if (teamLower.includes('support')) return 'team-support';
        return null;
    }

    // Copy to clipboard functionality
    copyBtn.addEventListener('click', function() {
        const actionItemsText = getActionItemsText();
        if (actionItemsText) {
            navigator.clipboard.writeText(actionItemsText).then(function() {
                showCopyToast();
            }).catch(function(err) {
                console.error('Could not copy text: ', err);
                // Fallback for older browsers
                copyToClipboardFallback(actionItemsText);
            });
        }
    });

    // Get action items as text
    function getActionItemsText() {
        const items = actionItems.querySelectorAll('.action-item');
        if (items.length === 0) return '';
        
        let text = 'Action Items:\n\n';
        items.forEach((item, index) => {
            const team = item.querySelector('.action-item-team').textContent;
            const task = item.querySelector('.action-item-task').textContent;
            const deadline = item.querySelector('.action-item-deadline span').textContent;
            
            text += `${index + 1}. ${team} → ${task} (${deadline})\n`;
        });
        
        return text;
    }

    // Fallback copy function
    function copyToClipboardFallback(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showCopyToast();
        } catch (err) {
            console.error('Fallback copy failed: ', err);
        }
        document.body.removeChild(textArea);
    }

    // Utility functions
    function setLoadingState(loading) {
        generateBtn.disabled = loading;
        if (loading) {
            generateBtn.classList.add('loading');
        } else {
            generateBtn.classList.remove('loading');
        }
    }

    function showError(message) {
        errorText.textContent = message;
        errorMessage.style.display = 'flex';
        resultsContainer.style.display = 'none';
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }

    function showResults() {
        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    function hideResults() {
        resultsContainer.style.display = 'none';
    }

    function showSuccessToast() {
        successToast.classList.add('show');
        setTimeout(() => {
            successToast.classList.remove('show');
        }, 3000);
    }

    function showCopyToast() {
        copyToast.classList.add('show');
        setTimeout(() => {
            copyToast.classList.remove('show');
        }, 2000);
    }

    // Auto-resize textarea
    const textarea = document.getElementById('meetingNotes');
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });

    // Add some example data on page load for demo purposes
    const exampleGoal = 'Prepare for product launch';
    const exampleNotes = `- Marketing needs to finalize campaign strategy
- Engineering is still testing payment gateway
- Sales team needs demo scripts
- Legal team needs to review terms of service
- Design team needs to create final marketing materials
- Customer support needs training on new features`;

    // Add example button (optional)
    const exampleBtn = document.createElement('button');
    exampleBtn.type = 'button';
    exampleBtn.className = 'example-btn';
    exampleBtn.innerHTML = '<i class="fas fa-lightbulb"></i> Load Example';
    exampleBtn.style.cssText = `
        background: #f7fafc;
        border: 2px solid #e2e8f0;
        color: #4a5568;
        padding: 10px 15px;
        border-radius: 8px;
        cursor: pointer;
        margin-top: 10px;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.3s ease;
    `;
    
    exampleBtn.addEventListener('click', function() {
        document.getElementById('meetingGoal').value = exampleGoal;
        document.getElementById('meetingNotes').value = exampleNotes;
        // Trigger auto-resize
        textarea.dispatchEvent(new Event('input'));
    });
    
    exampleBtn.addEventListener('mouseenter', function() {
        this.style.background = '#667eea';
        this.style.color = 'white';
        this.style.borderColor = '#667eea';
    });
    
    exampleBtn.addEventListener('mouseleave', function() {
        this.style.background = '#f7fafc';
        this.style.color = '#4a5568';
        this.style.borderColor = '#e2e8f0';
    });
    
    form.appendChild(exampleBtn);
});