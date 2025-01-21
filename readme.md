
# AWS Rekognition Integration

This guide explains how to set up an AWS account, enable AWS Rekognition, and configure your environment to use the service in your project.

---

## Prerequisites

- Node.js version >= 20
- An AWS account

---

## Setup Instructions

### 1. Sign Up for an AWS Account

1. Visit the [AWS Signup Page](https://aws.amazon.com/).
2. Create a new AWS account or sign in if you already have one.

---

### 2. Enable AWS Rekognition

1. Log in to the AWS Management Console.
2. Navigate to **Services** > **Rekognition**.
3. Enable Rekognition in your preferred region (default region for this guide is `us-east-1`).

---

### 3. Extract and Set AWS Keys

1. Navigate to the **IAM (Identity and Access Management)** section in the AWS Console.
2. Create a new user with programmatic access.
3. Assign the appropriate policies for Rekognition (e.g., `AmazonRekognitionFullAccess`).
4. Copy the generated **Access Key ID** and **Secret Access Key**.

---

### 4. Create a `.env` File

1. In the root of your project, create a new file named `.env`.
2. Add the following keys to the file:
   ```env
   AWS_ACCESS_KEY_ID=<Your_Access_Key_ID>
   AWS_SECRET_ACCESS_KEY=<Your_Secret_Access_Key>
   AWS_REGION=us-east-1
   ```

---

### 5. Install Dependencies

1. Ensure you have Node.js version >= 20 installed.
   You can check your version using:
   ```bash
   node -v
   npm install
   ```

### 6. Run the server

1. Run the server.
   ```bash
   node server.js
   ```