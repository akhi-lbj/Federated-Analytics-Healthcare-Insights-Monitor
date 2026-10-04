# AWS Lambda / Amazon ECR Production Container Image
FROM public.ecr.aws/lambda/python:3.11

# Copy requirements and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application package
COPY app/ ./app/

# AWS Lambda Handler (using Mangum ASGI adapter)
CMD ["app.main.handler"]
