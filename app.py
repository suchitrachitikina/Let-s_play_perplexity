from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
import os
import pypdf

app = Flask(__name__)
CORS(app)

# Configure Gemini with the new google-genai SDK
API_KEY = 'AIzaSyB4qvmzgB-5V_53s4A2JnZDB56p_-E8xH8'
client = genai.Client(api_key=API_KEY)
MODEL_ID = 'gemini-2.5-flash'

# Global context for the 'Simple RAG'
pdf_context = ''
uploaded_filename = ''

# Ensure uploads directory exists
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/api/upload', methods=['POST'])
def upload_pdf():
    global pdf_context, uploaded_filename
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        if file and file.filename.endswith('.pdf'):
            filepath = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(filepath)
            
            # Extract text from PDF
            reader = pypdf.PdfReader(filepath)
            text = ''
            for page in reader.pages:
                text += page.extract_text() + '\n'
            
            # Simplified RAG: Store the first 10,000 characters as context
            pdf_context = text[:10000] 
            uploaded_filename = file.filename
            
            return jsonify({
                'status': 'success',
                'filename': file.filename,
                'message': 'PDF uploaded and indexed successfully.'
            })
            
        return jsonify({'error': 'Invalid file type. Please upload a PDF.'}), 400
        
    except Exception as e:
        print(f'Upload Error: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    global pdf_context
    try:
        data = request.json
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
            
        # Retrieval Augmented Generation logic
        final_prompt = user_message
        if pdf_context:
            final_prompt = f'--- CONTEXT FROM UPLOADED PDF ---\n{pdf_context}\n\n--- QUESTION ---\n{user_message}'
            
        # Generate response using the new SDK client
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=final_prompt,
        )
        
        return jsonify({
            'response': response.text,
            'status': 'success'
        })
        
    except Exception as e:
        print(f'Chat Error: {str(e)}')
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)