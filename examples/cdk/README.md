# AWS Cognito Infrastructure for React Example

This CDK project sets up the AWS Cognito infrastructure required for the `@letsbelopez/cognito-example-react-simple` project. It creates a Cognito User Pool, App Client, and Identity Pool with secure authentication settings.

## Prerequisites

- [AWS CLI](https://aws.amazon.com/cli/) installed and configured with your credentials
- [Node.js](https://nodejs.org/) (v14 or later)
- [AWS CDK CLI](https://docs.aws.amazon.com/cdk/latest/guide/cli.html) installed (`npm install -g aws-cdk`)

## Infrastructure Overview

This stack creates:
- A Cognito User Pool with email-based authentication
- A User Pool Client configured for the React frontend
- A Cognito Identity Pool (for AWS credentials)
- Required IAM roles for authenticated users

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Bootstrap CDK (First time only)**
   If you haven't used CDK in your AWS account/region before:
   ```bash
   cdk bootstrap
   ```

3. **Deploy the Stack**
   ```bash
   cdk deploy
   ```

   After deployment, you'll see outputs similar to:
   ```
   Outputs:
   CdkStack.UserPoolId = us-east-1_xxxxxx
   CdkStack.UserPoolClientId = xxxxxxxxxxxxxxxxxxxxxxxxxx
   CdkStack.IdentityPoolId = us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   CdkStack.Region = us-east-1
   ```

   Save these values as you'll need them for the React application.

## Connecting with the React Example

1. **Configure the React Application**
   
   In your React project (`@letsbelopez/cognito-example-react-simple`), create a `.env` file with the following values from your CDK outputs:

   ```env
   VITE_AWS_REGION=<Region>
   VITE_COGNITO_USER_POOL_ID=<UserPoolId>
   VITE_COGNITO_CLIENT_ID=<UserPoolClientId>
   VITE_COGNITO_IDENTITY_POOL_ID=<IdentityPoolId>
   ```

2. **Start Using the Application**
   - Users can sign up with their email address
   - Email verification is required
   - Authentication is required for all protected resources
   - Refresh tokens are valid for 30 days

## Security Features

- Email verification required
- Secure password policy (minimum 8 characters, requires mixed case, numbers, and symbols)
- No unauthenticated access allowed
- Token-based authentication with 1-hour access tokens
- 30-day refresh tokens for extended sessions

## Useful Commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## Cleanup

To avoid incurring future charges, you can destroy the infrastructure:
```bash
cdk destroy
```

## Security Considerations

- The User Pool is configured with `DESTROY` removal policy for development. Change to `RETAIN` for production use.
- Review and customize the authenticated role permissions based on your application's needs.
- Consider implementing additional security measures for production use:
  - Custom domains for hosted UI
  - Advanced password policies
  - MFA
  - Additional user attributes

## Troubleshooting

1. **Email Verification**
   - Users must verify their email before they can sign in
   - Check spam folder for verification emails
   - Use the AWS Console to manually confirm users if needed

2. **Deployment Issues**
   - Ensure AWS credentials are properly configured
   - Check CloudWatch logs for detailed error messages
   - Verify you have necessary permissions in your AWS account

## Contributing

Feel free to submit issues and enhancement requests!
