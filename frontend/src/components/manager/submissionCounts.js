export function countSubmissionsByStatus(submissions, submissionStatus) {
  return submissions.filter((submission) => submission.submission_status === submissionStatus)
    .length
}
