// hakanaltun.io translation worker — Qwen 3.8 27B

export default {
  async fetch(request, env) {
    const allowedOrigins = [
      "https://hakanaltun.io",
      "https://www.hakanaltun.io"
    ];

    const origin = request.headers.get("Origin");

    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
        ? origin
        : "https://hakanaltun.io",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
      "Content-Type": "application/json; charset=utf-8"
    };

    if (request.method === "OPTIONS") {
      if (!allowedOrigins.includes(origin)) {
        return new Response(null, {
          status: 403,
          headers: corsHeaders
        });
      }

      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (request.method !== "POST") {
      return Response.json(
        {
          error: "Only POST requests are allowed."
        },
        {
          status: 405,
          headers: corsHeaders
        }
      );
    }

    if (!allowedOrigins.includes(origin)) {
      return Response.json(
        {
          error: "Origin not allowed."
        },
        {
          status: 403,
          headers: corsHeaders
        }
      );
    }

    try {
      const body = await request.json();

      const text = String(body.text || "").trim();
      const context = String(body.context || "").trim();

      if (!text) {
        return Response.json(
          {
            error: "No text provided."
          },
          {
            status: 400,
            headers: corsHeaders
          }
        );
      }

      if (text.length > 500) {
        return Response.json(
          {
            error: "Selected text is too long."
          },
          {
            status: 400,
            headers: corsHeaders
          }
        );
      }

      if (context.length > 1500) {
        return Response.json(
          {
            error: "Context is too long."
          },
          {
            status: 400,
            headers: corsHeaders
          }
        );
      }

      const userMessage = context
        ? `TEXT TO TRANSLATE:
${text}

CONTEXT:
${context}

Translate only TEXT TO TRANSLATE.
Use CONTEXT only to determine the intended meaning and grammatical role.`
        : `TEXT TO TRANSLATE:
${text}`;

      const result = await env.AI.run(
        "@cf/qwen/qwen3.8-27b",
        {
          messages: [
            {
              role: "system",
              content: `Translate English into natural, idiomatic Turkish.

The user may select a single word, a phrase, part of a sentence, or a complete sentence while reading an English text.

Preserve the precise meaning, tone, tense, pronouns, ambiguity, imagery, register, and grammatical function of the selected text.

Use the supplied CONTEXT only to determine the intended meaning and grammatical role of TEXT TO TRANSLATE. Translate only TEXT TO TRANSLATE. Never translate or reproduce the surrounding context unless it is itself part of TEXT TO TRANSLATE.

For words and sentence fragments, give the natural Turkish equivalent appropriate to their role in the context. Do not treat a fragment as an independent sentence.

In particular:
- Never turn a non-imperative verb or verb phrase into an imperative.
- When an English verb phrase is selected as a lexical expression, prefer the natural Turkish infinitive form when appropriate.
- Preserve whether a phrase functions as a noun, verb, adjective, adverb, or other grammatical unit.
- Do not add a subject, object, tense, person, or other grammatical information that is not expressed by the selected text or required by Turkish.
- Do not make an ambiguous expression more specific unless the context clearly supports that interpretation.

Prefer natural Turkish syntax and idiom over literal word-for-word correspondence.

Turkish has no definite article. Do not mechanically translate English "the" as "o", "bu", or another demonstrative. Use a demonstrative only when the English meaning or context genuinely requires one.

Examples of the intended behaviour:
"hold onto" in "I had nothing to hold onto." → "tutunmak", not "tutun"
"the place" → normally "yer" or "mekân", not "o yer"
"had climbed onto the bed" → preserve the past-perfect relationship naturally in Turkish when the selected text includes it

Return only the Turkish translation of TEXT TO TRANSLATE.

Do not add explanations, definitions, alternatives, notes, labels, quotation marks, commentary, introductory text, or the original English.`
            },
            {
              role: "user",
              content: userMessage
            }
          ],

          reasoning_effort: null,

          chat_template_kwargs: {
            enable_thinking: false
          },

          temperature: 0.1,
          max_completion_tokens: 256
        }
      );

      const translation =
        result?.choices?.[0]?.message?.content ??
        result?.response ??
        "";

      if (!translation) {
        throw new Error(
          "AI returned no translation. Raw result: " +
          JSON.stringify(result)
        );
      }

      return Response.json(
        {
          translation: translation.trim()
        },
        {
          status: 200,
          headers: corsHeaders
        }
      );

    } catch (error) {
      console.error(error);

      return Response.json(
        {
          error: "Translation failed.",
          detail: error?.message || String(error)
        },
        {
          status: 500,
          headers: corsHeaders
        }
      );
    }
  }
};
