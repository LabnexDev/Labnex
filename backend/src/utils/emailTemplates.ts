interface AccountCreationEmailProps {
  userName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}

export const getAccountCreationEmailHtml = ({
  userName,
  email,
  temporaryPassword,
  loginUrl,
}: AccountCreationEmailProps): string => {
  // Using a similar structure and styling to the provided waitlist email
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Labnex!</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    body {
      margin: 0;
      padding: 0;
      background-color: #111827; /* slate-900 approximation */
      font-family: 'Inter', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #1f2937; /* slate-800 approximation */
      color: #f3f4f6; /* gray-100 approximation */
      padding: 30px;
      border-radius: 8px;
    }
    .header h2 {
      color: #8b5cf6; /* A vibrant purple */
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .content p {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 15px;
      color: #d1d5db; /* gray-300 approximation */
    }
    .content strong {
      color: #e5e7eb; /* gray-200 for emphasis */
    }
    .content a {
      color: #60a5fa; /* A nice blue for links */
      text-decoration: none;
      font-weight: 600;
    }
    .credentials-box {
      background-color: #374151; /* slate-700 for contrast */
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .credentials-box p {
      margin: 5px 0;
    }
    .button-cta {
      display: inline-block;
      background-color: #6366f1; /* Indigo */
      color: #ffffff;
      padding: 12px 25px;
      text-align: center;
      text-decoration: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      margin-top: 10px;
      margin-bottom: 20px;
    }
    .footer {
      font-size: 12px;
      color: #6b7280; /* gray-500 approximation */
      text-align: center;
      margin-top: 30px;
      border-top: 1px solid #374151; /* slate-700 for divider */
      padding-top: 20px;
    }
    @media screen and (max-width: 600px) {
      .email-container {
        padding: 20px;
      }
      .header h2 {
        font-size: 22px;
      }
      .content p {
        font-size: 15px;
      }
      .button-cta {
        padding: 10px 20px;
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #111827;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table class="email-container" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td>
              <div class="header">
                <h2>🚀 Your Labnex Account is Ready!</h2>
              </div>
              <div class="content">
                <p>Hi ${userName},</p>
                <p>Welcome to Labnex! Your account has been successfully created by an administrator.</p>
                <p>You can now log in using the following credentials:</p>
                <div class="credentials-box">
                  <p><strong>Email (Username):</strong> ${email}</p>
                  <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
                </div>
                <p>For your security, please change this temporary password immediately after your first login.</p>
                <a href="${loginUrl}" class="button-cta">Log In to Labnex</a>
                <p>If you have any questions, please contact your administrator.</p>
                <p>Best regards,<br>The Labnex Team</p>
              </div>
              <div class="footer">
                <p>This email was sent because an administrator created an account for you on Labnex.</p>
                <p>&copy; ${new Date().getFullYear()} Labnex. All rights reserved.</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}; 