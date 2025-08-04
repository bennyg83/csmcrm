# 🚀 GCP Free Tier Deployment Reminder

**Target Date:** August 10th, 2024

## 🎯 Purpose
Deploy the CRM application to Google Cloud Platform free tier for testing and friend feedback.

## 📋 Tasks
- [ ] Set up GCP project and billing account
- [ ] Enable required APIs (Cloud Run, Cloud SQL, Cloud Build)
- [ ] Create Cloud SQL PostgreSQL instance (db-f1-micro, 1GB storage)
- [ ] Deploy backend to Cloud Run (free tier limits)
- [ ] Deploy frontend to Cloud Run (free tier limits)
- [ ] Configure environment variables and database connection
- [ ] Test all features in cloud environment
- [ ] Share URL with friends for feedback
- [ ] Monitor usage and costs (should be $0/month)

## 💰 Cost Estimate
- **Free Tier:** $0/month for testing phase
- **If exceeded:** $17-45/month (unlikely for testing)

## 🔗 Resources
- [GCP Free Tier](https://cloud.google.com/free)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL PostgreSQL](https://cloud.google.com/sql/docs/postgres)

## 📝 Notes
- Perfect for friend feedback and testing
- Production-like environment
- Easy scaling if needed
- No migration required for future growth

## 🎯 Quick Commands (when ready)
```bash
# 1. Install Google Cloud CLI
# 2. Initialize project
gcloud init

# 3. Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# 4. Create Cloud SQL instance
gcloud sql instances create crm-database \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1

# 5. Deploy backend
gcloud run deploy crm-backend \
  --source ./backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# 6. Deploy frontend
gcloud run deploy crm-frontend \
  --source ./frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---
*Created as a reminder for August 10th deployment planning* 