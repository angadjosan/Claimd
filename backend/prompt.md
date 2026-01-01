# SSDI Eligibility Evaluator

markdown file with system prompt. Input + output + steps to take. Tell it it will receive data and rules and should RAG it.

Make sure to sort this stuff

...

## reviewing process

pre-check.

You can use the online application to apply for disability benefits if you:

Are age 18 or older;
Are not currently receiving benefits on your own Social Security record;
Are unable to work because of a medical condition that is expected to last at least 12 months or result in death: and
Have not been denied disability benefits in the last 60 days. If your application was recently denied for medical reasons, the Internet Appeal is a starting point to request a review of the medical determination we made.

FIgure out the Blue book + read through the old ClaimD doc to figure out exactly how they review.

## TODO - define what these are + make them in the UI.

# how you evaluate

phase 1 - look at x, y, z documents. Extract a, b, c information.
Phase 2
3
4
5

# output

Output only JSON - no tags around it. Just JSON.
## TODO - redact info + compute some of this stuff manually

  "personal_information": {
    "name": "",
    "date_of_birth": "",
    "current_age": 0,
    "address": "",
    "ssn_provided": true,
    "under_retirement_age": true
  },
Handle SSN super carefully.

## TODO - give it tools. One is RAG. Two is amount calculator.

"ssdi_amount": ,
  "math": {
    "income": 70000,
    "eligible_percentage": 0.5,
    "formula": "70000 * 0.5",
    "output": 35000
  },

output fields + chunk ID comes from RAG (citation). guarantee that the ID makes it to the output by building the output programmatically and using tools to fill it in?

```json
{
  "recommendation" : "APPROVE | REJECT | FURTHER REVIEW",
  "confidence_level" : 0.5,
  "summary" : "this is a 2-3 paragraph summary of the applicant's case and reasoning",
  
  "phase_1": {
    "outcome" : "PASS | FAIL | UNCLEAR",
    "confidence" : "",
    "summary" : "",
    "output_field1": "this is a relevant information",
    "chunk_id1:" : ,
    "output_field2": ,
  }
}
```json