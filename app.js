document.addEventListener('DOMContentLoaded', () => {
	// Shared constants
	const GEMINI_API_KEY = 'AIzaSyC-DbnwW8jCF0QJj-Hj1R36hJFI9Pf0_U4';
	const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

	// Title Generator Object
	const titleGenerator = {
		init() {
			this.form = document.querySelector('#title-generator');
			this.input = this.form.querySelector('input');
			this.btn = this.form.querySelector('button');
			this.results = this.form.querySelector('.results');
			this.btn.addEventListener('click', () => this.generateTitles());
		},

		async generateTitles() {
			const keywords = this.input.value.trim();
			if (!keywords) return;
			
			this.showLoading();
			
			try {
				const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						contents: [{
							parts: [{
								text: `Generate 15 SEO-optimized title variations for content about ${keywords}. 
									Make them catchy, keyword-rich, and under 60 characters. 
									Include power words and emotional triggers. 
									Format as a numbered list:`
							}]
						}]
					})
				});

				if (!response.ok) throw new Error('API request failed');
				
				const data = await response.json();
				const titles = data.candidates[0].content.parts[0].text
					.split('\n')
					.filter(line => line.match(/^\d+\./))
					.map(line => line.replace(/^\d+\.\s*/, ''))
					.slice(0, 15);

				this.displayResults(titles);
				
			} catch (error) {
				this.results.innerHTML = `
					<div class="alert alert-danger">
						Error: ${error.message}. Please try again later.
					</div>
				`;
			}
		},

		showLoading() {
			this.results.innerHTML = `
				<div class="text-center">
					<div class="spinner-border text-primary" role="status">
						<span class="visually-hidden">Loading...</span>
					</div>
				</div>
			`;
		},

		displayResults(titles) {

				this.results.innerHTML = titles.map(title => `
					<div class="result-item p-3 mb-2 bg-white rounded shadow-sm">
						<div class="form-check">
							<input class="form-check-input title-radio" type="radio" 
								   name="selectedTitle" id="${title}" 
								   value="${title}">
							<label class="form-check-label" for="${title}">
								<h5 class="mb-2" contenteditable="true" spellcheck="true">${title}</h5>
							</label>
						</div>
						<div class="d-flex justify-content-between align-items-center">
							<small class="text-muted"><span class="char-count">${title.length}</span> chars</small>
							<button class="btn btn-sm btn-outline-primary copy-btn" 
									data-title="${title}">Copy</button>
						</div>
					</div>
				`).join('');
		
				// Update radio button handlers to work with editable titles
				document.querySelectorAll('.title-radio').forEach(radio => {
					const titleElement = radio.parentElement.querySelector('h5');
					
					// Handle title edits
					titleElement.addEventListener('input', () => {
						const newTitle = titleElement.textContent;
						radio.value = newTitle;
						radio.id = newTitle;
						if(radio.checked) {
							document.getElementById('selectedTitle').value = newTitle;
						}
						// Update character count
						titleElement.closest('.result-item').querySelector('.char-count').textContent = newTitle.length;
					});
		
					radio.addEventListener('change', (e) => {
						if(e.target.checked) {
							document.getElementById('selectedTitle').value = titleElement.textContent;
						}
					});
				});
			}
		}
	

	// Outline Generator Object
	const outlineGenerator = {
		init() {
				this.generateBtn = document.getElementById('generateOutlines');
				this.regenerateBtn = document.getElementById('regenerateOutlines');
				this.outlineBoxes = document.querySelectorAll('.outline-box');
				this.loadingIndicators = document.querySelectorAll('.loading-indicator');
				
				// Setup individual regenerate buttons
				document.querySelectorAll('.regenerate-btn').forEach((btn, index) => {
					btn.addEventListener('click', () => this.generateSingleOutline(index));
				});
				
				this.generateBtn.addEventListener('click', () => this.generateAllOutlines());
				this.regenerateBtn.addEventListener('click', () => this.generateAllOutlines());
			},
		
			async generateSingleOutline(index) {
				const title = document.getElementById('selectedTitle').value;
				const keywords = document.querySelector('#title-generator input').value;
				
				if(!title || !keywords) {
					alert('Please select a title and ensure keywords are entered');
					return;
				}
		
				// Show loading indicator for specific outline
				this.loadingIndicators[index].classList.remove('d-none');
				
				try {
					const prompt = `Create a detailed content outline for "${title}" using "${keywords}" as focus keyword.
						Generate exactly 10 main headlines with supporting points.
						Format as:
						
						1. [Engaging Main Headline]
						   - Supporting point
						   - Key detail
						   
						2. [Another Headline with ${keywords} integration]
						   - Important aspect
						   - Critical information
						
						Continue this pattern for all 10 headlines.
						Make headlines SEO-friendly and engaging.`;
		
					const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							contents: [{ parts: [{ text: prompt }] }]
						})
					});
		
					if (!response.ok) throw new Error('API request failed');
					
					const data = await response.json();
					const outlineContent = data.candidates[0].content.parts[0].text;
					
					// Format and set the outline content
					this.outlineBoxes[index].value = this.formatOutlineContent(outlineContent);
		
				} catch(error) {
					this.outlineBoxes[index].value = `Error: ${error.message}`;
				} finally {
					this.loadingIndicators[index].classList.add('d-none');
				}
			},
		
			formatOutlineContent(text) {
				return text
					.replace(/^\s+/gm, '')  // Remove leading spaces
					.replace(/\n{3,}/g, '\n\n')  // Normalize spacing
					.split('\n')
					.map(line => {
						if (line.match(/^\d+\./)) {
							return `\n${line}`;  // Add extra space before main headlines
						}
						return line;
					})
					.join('\n');
			},
		
			async generateAllOutlines() {
				for(let i = 0; i < this.outlineBoxes.length; i++) {
					await this.generateSingleOutline(i);
				}
			}
		};

	// Initialize all tools
	

	// Initialize both generators
	titleGenerator.init();
	outlineGenerator.init();
});
