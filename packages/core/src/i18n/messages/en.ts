/**
 * English is the reference dictionary: its keys define `MessageKey`, and `ar.ts` must provide every one
 * (enforced by the compiler) with the same placeholders (enforced by a test). Plural messages use CLDR
 * categories; see `plural.ts`.
 */
export const en = {
  'app.name': 'Mumken',
  'app.workspace': 'Research workspace',
  'a11y.skipToContent': 'Skip to content',

  'language.switchTo': 'العربية',
  'language.switchLabel': 'Switch language to Arabic',
  'language.name': 'English',
  'language.code': 'EN',

  'nav.records': 'Records',
  'nav.monitoring': 'Monitoring',
  'nav.breadcrumb': 'Breadcrumb',
  'nav.back': 'Back',
  'nav.recordDiscussion': 'Record discussion',
  'nav.reply': 'Reply',
  'nav.settings': 'Settings',

  'records.title': 'Published records',
  'records.subtitle': 'Read the latest updates and join the discussion.',
  'records.open': 'Open discussion',

  'record.published': 'Published',
  'record.publishedOn': 'Published {date}',
  'record.source': 'Source',
  'record.sourceLine': 'Source: {source} · {date}',
  'record.metaLine': '{reference} · {status}',

  'discussion.title': 'Discussion',
  'discussion.count': { one: '{count} comment', other: '{count} comments' },
  'discussion.listLabel': 'Comments',

  'composer.label': 'Add a comment',
  'composer.placeholder': 'Add a comment...',
  'composer.hint': 'Be clear and constructive.',
  'composer.shortcut': 'Press {shortcut} to post.',
  'composer.submit': 'Post comment',
  'composer.submitting': 'Posting…',
  'composer.retry': 'Retry',
  'composer.postingAs': 'Posting as {name}',
  'composer.remaining': { one: '{count} character left', other: '{count} characters left' },
  'composer.overLimit': {
    one: '{count} character over the limit',
    other: '{count} characters over the limit',
  },

  'reply.label': 'Reply to {name}',
  'reply.placeholder': 'Write a reply...',
  'reply.submit': 'Post reply',
  'reply.cancel': 'Cancel',
  'reply.replyingTo': 'Replying to {name}',
  'reply.draftHint': 'Draft text remains available if submission fails.',

  'validation.empty': 'Write something before posting.',
  'validation.too_long': 'Comments can be up to {max} characters.',

  'submitError.title': 'Comment wasn’t posted',
  'submitError.replyTitle': 'Reply wasn’t posted',
  'submitError.draftPreserved': 'Draft preserved',
  'submitError.body': 'Check your connection and try again. Your text is still here to edit or retry.',
  'submitError.rejected': 'This comment couldn’t be accepted. Edit it and try again.',

  'announce.commentPosted': 'Your comment was posted.',
  'announce.replyPosted': 'Your reply was posted.',

  'comment.reply': 'Reply',
  'comment.replyTo': 'Reply to {name}',
  'comment.edited': 'Edited',
  'comment.you': 'You',
  'comment.replies': { one: '{count} reply', other: '{count} replies' },

  'state.loading': 'Loading discussion…',
  'state.loadingTitle': 'Loading',
  'state.loadingRecord': 'Loading record…',
  'state.empty.title': 'No comments yet',
  'state.empty.body': 'Start the discussion by adding a comment.',
  'state.empty.action': 'Add first comment',
  'state.loadError.title': 'Couldn’t load discussion',
  'state.loadError.body': 'Check your connection and try again.',
  'state.retry': 'Try again',
  'state.unavailable.title': 'Record unavailable',
  'state.unavailable.body': 'This record may have been removed, or the link may be incorrect.',
  'state.unavailable.action': 'Back to records',
  'state.pageNotFound.title': 'Page not found',
  'state.pageNotFound.body': 'The page you are looking for doesn’t exist or has moved.',
  'state.commentUnavailable.title': 'Comment unavailable',
  'state.commentUnavailable.body': 'This comment may have been removed.',
  'state.recordError.title': 'Couldn’t load this record',
  'state.generic.title': 'Something went wrong',
  'state.generic.body': 'An unexpected error occurred. Please try again.',

  'time.justNow': 'just now',
  'time.minutes': { one: '{count} min ago', other: '{count} min ago' },
  'time.hours': { one: '{count} hr ago', other: '{count} hr ago' },
  'time.days': { one: '{count} day ago', other: '{count} days ago' },

  'devtools.title': 'Reviewer tools',
  'devtools.description': 'Simulate network conditions to reach every state of the journey.',
  'devtools.latency': 'Network speed',
  'devtools.latency.instant': 'Instant',
  'devtools.latency.normal': 'Normal',
  'devtools.latency.slow': 'Slow',
  'devtools.failSubmissions': 'Posting comments',
  'devtools.failSubmissions.off': 'Succeeds',
  'devtools.failSubmissions.once': 'Fails once',
  'devtools.failSubmissions.always': 'Always fails',
  'devtools.failDiscussionLoad': 'Fail loading the discussion',
  'devtools.loadHint': 'Takes effect the next time the discussion loads.',
  'devtools.reset': 'Reset',

  'settings.language': 'Language',
  'settings.done': 'Done',
} as const;
