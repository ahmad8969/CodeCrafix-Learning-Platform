# Database Documentation

## Engine

MongoDB via Mongoose.

## Core collections (selected)

| Domain | Models |
|--------|--------|
| Identity | User, Institute, AuditLog, Notification |
| Learning | Course, Category, Batch, Module, Week, Topic, Lesson, Resource, Enrollment, StudentProgress |
| Assessment | PracticeQuestion, Assignment, AssignmentSubmission, Quiz, QuizAttempt |
| Live | LiveClass, Attendance, Announcement, CalendarEvent, ClassRecording |
| Certificates | Certificate, CertificateTemplate, CertificateRule, Gamification models |
| Finance | Admission, FeePlan, StudentFeeAccount, Payment, Receipt, Expense, Income |
| Communication | Conversation, ChatMessage, Ticket, CrmLead, Survey, CareerProfile, JobPosting, AlumniProfile |

## Indexing strategy

- Hot filters: status, role, course, student, institute, createdAt
- Unique: email, certificateNumber, verificationToken, ticketNumber
- Compound: `{ institute, role, status }`, ticket `{ institute, status, updatedAt }`
- Text search: message body text index

## Backup

See [BACKUP.md](BACKUP.md).
