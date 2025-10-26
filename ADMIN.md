# Admin Functionality

## Deleting Community Updates

An admin delete feature has been added to allow moderators to remove inappropriate or spam submissions.

### Setup

1. Add your admin secret key to `.env.local`:
   ```bash
   ADMIN_SECRET_KEY=your_secure_random_key_here
   ```

   You can generate a secure key using:
   ```bash
   openssl rand -base64 32
   ```

2. Restart your development server after adding the environment variable.

### How to Delete a Submission

1. Navigate to the Community Feed
2. Each submission has a small trash icon (🗑️) in the top-right corner
3. Click the trash icon to open the delete confirmation modal
4. Enter your admin key (the value from `ADMIN_SECRET_KEY` in your `.env.local`)
5. Click "Delete" to confirm

### API Endpoint

**DELETE** `/api/submissions/[id]`

**Headers:**
- `Authorization: Bearer YOUR_ADMIN_KEY`

**Response:**
- `200` - Success, submission deleted
- `401` - Unauthorized (invalid or missing admin key)
- `404` - Submission not found
- `500` - Server error

**Example using curl:**
```bash
curl -X DELETE \
  http://localhost:3000/api/submissions/[submission-id] \
  -H "Authorization: Bearer your_admin_key_here"
```

**Example using fetch:**
```javascript
const response = await fetch(`/api/submissions/${submissionId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${adminKey}`
  }
});
```

### Security Notes

- The admin key is required for all delete operations
- The key is checked server-side before any deletion occurs
- Never commit your `.env.local` file with the actual admin key
- Use a strong, randomly generated key
- Consider implementing rate limiting for production use
- For production, consider using a more robust authentication system (NextAuth, Supabase Auth, etc.)

### Files Modified

1. **`app/api/submissions/[id]/route.ts`** - DELETE endpoint with admin auth
2. **`lib/admin-auth.ts`** - Admin authentication helper functions
3. **`components/CommunityFeed.tsx`** - UI for delete button and modal
4. **`.env.local.example`** - Environment variable documentation
