# Setup script for Ollama LLM service
Write-Host "Setting up Ollama LLM service..." -ForegroundColor Green

# Start the containers
Write-Host "Starting Docker containers..." -ForegroundColor Yellow
docker-compose up -d

# Wait for Ollama to be ready
Write-Host "Waiting for Ollama service to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Pull a lightweight model (llama2:7b is a good balance of performance and resource usage)
Write-Host "Downloading Llama2 model (this may take a few minutes)..." -ForegroundColor Yellow
docker exec crm-ollama ollama pull llama2:7b

# Verify the model is available
Write-Host "Verifying model installation..." -ForegroundColor Yellow
docker exec crm-ollama ollama list

Write-Host "LLM setup complete!" -ForegroundColor Green
Write-Host "You can now use document processing in the CRM." -ForegroundColor Green
Write-Host "Access the application at: http://localhost:5173" -ForegroundColor Cyan 