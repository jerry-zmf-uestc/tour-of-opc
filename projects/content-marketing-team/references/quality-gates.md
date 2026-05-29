# Quality Gates

The content workflow has three human gates. Each gate should be reviewable from files, not hidden conversation state.

## outline_review

Approve only when:

- topic, audience, and reader problem are explicit
- core claims cite local wiki paths or external sources
- evidence gaps and weak claims are visible
- the outline has an argument, not just a list of notes

Reject or retry when the evidence pack is thin, unsourced, or mismatched to the topic.

## final_review

Approve only when:

- the draft follows the approved outline or explains meaningful deviations
- important claims retain source notes
- unresolved `[verify: ...]` items are resolved or accepted
- private paths, internal notes, and evidence appendix handling are acceptable

Approval triggers local final packaging and Obsidian `writing/finals/` write-back.

## publish_review

Approve only when:

- target channels are explicit or default local channel drafts are acceptable
- no external side effect is expected from the current local closure
- private paths and source notes are handled according to channel needs
- follow-up external publishing can be performed by `content-publishing`

Approval currently creates local draft packages and a publish log; it does not publish externally.
