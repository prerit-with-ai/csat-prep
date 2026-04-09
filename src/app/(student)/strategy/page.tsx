import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function StrategyPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-page-title font-semibold mb-8">Strategy Guide</h1>

      {/* About CSAT */}
      <section className="mb-8">
        <h2 className="text-section font-semibold mb-4">About CSAT</h2>
        <div
          className="p-5 mb-4"
          style={{
            border: "1px solid var(--border-default)",
            borderRadius: "12px",
          }}
        >
          <p className="text-body mb-3" style={{ lineHeight: 1.7 }}>
            CSAT is Paper 2 of UPSC Prelims. It is a qualifying paper, but you
            must clear it to move forward.
          </p>
          <ul
            className="text-body space-y-2"
            style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}
          >
            <li>
              <strong style={{ color: "var(--text-primary)" }}>
                Total marks:
              </strong>{" "}
              200
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>
                Questions:
              </strong>{" "}
              80
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>
                Duration:
              </strong>{" "}
              2 hours (120 minutes)
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>
                Qualifying score:
              </strong>{" "}
              66/200 (33%)
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>
                Marking:
              </strong>{" "}
              Each correct answer = 2.5 marks
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>
                Negative marking:
              </strong>{" "}
              1/3 mark deducted for wrong answers (-0.83 per wrong)
            </li>
          </ul>
        </div>
      </section>

      {/* Scoring Formula */}
      <section className="mb-8">
        <h2 className="text-section font-semibold mb-4">Scoring Formula</h2>
        <div
          className="p-5 mb-4"
          style={{
            border: "1px solid var(--border-default)",
            borderRadius: "12px",
          }}
        >
          <div className="space-y-3 text-body" style={{ lineHeight: 1.7 }}>
            <div>
              <span style={{ color: "var(--color-correct)", fontWeight: 600 }}>
                Correct:
              </span>{" "}
              +2.5 marks
            </div>
            <div>
              <span style={{ color: "var(--color-wrong)", fontWeight: 600 }}>
                Wrong:
              </span>{" "}
              -0.83 marks (1/3 of 2.5)
            </div>
            <div>
              <span style={{ color: "var(--text-tertiary)", fontWeight: 600 }}>
                Skip:
              </span>{" "}
              0 marks
            </div>
            <div
              className="mt-4 pt-4"
              style={{ borderTop: "1px solid var(--border-default)" }}
            >
              <strong>Net score formula:</strong>
              <br />
              (Correct × 2.5) - (Wrong × 0.83)
            </div>
          </div>
        </div>
      </section>

      {/* The ABC Method */}
      <section className="mb-8">
        <h2 className="text-section font-semibold mb-4">The ABC Method</h2>
        <div
          className="p-5 mb-4"
          style={{
            border: "1px solid var(--border-default)",
            borderRadius: "12px",
          }}
        >
          <p className="text-body mb-4" style={{ lineHeight: 1.7 }}>
            Tag every question during mock tests with one of three categories:
          </p>
          <div className="space-y-4">
            <div>
              <div className="font-semibold text-body mb-1">
                A (Ab Karo) - Do it now
              </div>
              <p
                className="text-body"
                style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}
              >
                You are confident and can solve this immediately. These are your
                locked marks.
              </p>
            </div>
            <div>
              <div className="font-semibold text-body mb-1">
                B (Baad mein) - Do it later
              </div>
              <p
                className="text-body"
                style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}
              >
                You can do it, but it needs time. Flag and revisit after all A
                questions are done.
              </p>
            </div>
            <div>
              <div className="font-semibold text-body mb-1">
                C (Chorh Do) - Skip entirely
              </div>
              <p
                className="text-body"
                style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}
              >
                You have no clue or it will take too long. Skip without guilt.
              </p>
            </div>
          </div>
          <div
            className="mt-4 p-4"
            style={{
              borderLeft: "3px solid var(--color-amber)",
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "8px",
            }}
          >
            <p className="text-body" style={{ lineHeight: 1.7 }}>
              <strong>Goal:</strong> Convert C→B and B→A over time through
              targeted practice and revision.
            </p>
          </div>
        </div>
      </section>

      {/* Recommended Attempt Order */}
      <section className="mb-8">
        <h2 className="text-section font-semibold mb-4">
          Recommended Attempt Order
        </h2>
        <div
          className="p-5 mb-4"
          style={{
            border: "1px solid var(--border-default)",
            borderRadius: "12px",
          }}
        >
          <ol
            className="text-body space-y-3"
            style={{ lineHeight: 1.7, paddingLeft: "1.5rem" }}
          >
            <li>
              <strong>Passage-based RC first</strong> - These are your most
              predictable marks. Read carefully, answer confidently.
            </li>
            <li>
              <strong>LR/Math patterns you know</strong> - All A-tagged
              questions. Don't overthink, just execute.
            </li>
            <li>
              <strong>B-tagged questions with remaining time</strong> - Work
              through flagged questions systematically.
            </li>
            <li>
              <strong>Skip all C-tagged</strong> - Don't waste time. A blank is
              better than a wrong guess.
            </li>
          </ol>
          <div
            className="mt-4 p-4"
            style={{
              borderLeft: "3px solid var(--color-amber)",
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "8px",
            }}
          >
            <p className="text-body" style={{ lineHeight: 1.7 }}>
              <strong>Key insight:</strong> Time management is more important
              than attempting every question. Quality over quantity.
            </p>
          </div>
        </div>
      </section>

      {/* 10-Year PYQ Analysis */}
      <section className="mb-8">
        <h2 className="text-section font-semibold mb-4">
          10-Year PYQ Analysis (2016–2025)
        </h2>
        <div
          className="p-5 mb-4"
          style={{
            border: "1px solid var(--border-default)",
            borderRadius: "12px",
          }}
        >
          <p className="text-body mb-4" style={{ lineHeight: 1.7 }}>
            Average topic breakdown based on past 10 years:
          </p>
          <div className="space-y-3 text-body" style={{ lineHeight: 1.7 }}>
            <div className="flex justify-between">
              <span>Reading Comprehension:</span>
              <span style={{ color: "var(--text-secondary)" }}>
                25-30 questions
              </span>
            </div>
            <div className="flex justify-between">
              <span>Logical Reasoning:</span>
              <span style={{ color: "var(--text-secondary)" }}>
                20-25 questions
              </span>
            </div>
            <div className="flex justify-between">
              <span>Mathematics:</span>
              <span style={{ color: "var(--text-secondary)" }}>
                20-25 questions
              </span>
            </div>
            <div
              className="text-sm pt-3"
              style={{
                borderTop: "1px solid var(--border-default)",
                color: "var(--text-tertiary)",
              }}
            >
              (Arithmetic, Geometry, Data Interpretation)
            </div>
          </div>
          <div
            className="mt-4 p-4"
            style={{
              borderLeft: "3px solid var(--color-amber)",
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "8px",
            }}
          >
            <p className="text-body" style={{ lineHeight: 1.7 }}>
              <strong>Key observation:</strong> RC is the most predictable
              section. Math difficulty varies year to year. Build strong RC and
              LR foundations first.
            </p>
          </div>
        </div>
      </section>

      {/* Target Scorecard */}
      <section className="mb-8">
        <h2 className="text-section font-semibold mb-4">Target Scorecard</h2>
        <div
          className="p-5 mb-4"
          style={{
            border: "1px solid var(--border-default)",
            borderRadius: "12px",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-body" style={{ lineHeight: 1.5 }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border-default)",
                  }}
                >
                  <th className="py-2 text-left font-semibold">Target Score</th>
                  <th className="py-2 text-left font-semibold">
                    Correct needed
                  </th>
                  <th className="py-2 text-left font-semibold">
                    Can afford to wrong
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border-default)",
                  }}
                >
                  <td className="py-3">66 (qualifying)</td>
                  <td className="py-3" style={{ color: "var(--text-secondary)" }}>
                    27-30
                  </td>
                  <td className="py-3" style={{ color: "var(--text-secondary)" }}>
                    10-15
                  </td>
                </tr>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border-default)",
                  }}
                >
                  <td className="py-3">100</td>
                  <td className="py-3" style={{ color: "var(--text-secondary)" }}>
                    42-45
                  </td>
                  <td className="py-3" style={{ color: "var(--text-secondary)" }}>
                    10-15
                  </td>
                </tr>
                <tr>
                  <td className="py-3">140</td>
                  <td className="py-3" style={{ color: "var(--text-secondary)" }}>
                    58-62
                  </td>
                  <td className="py-3" style={{ color: "var(--text-secondary)" }}>
                    10-15
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            className="mt-4 p-4"
            style={{
              borderLeft: "3px solid var(--color-amber)",
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "8px",
            }}
          >
            <p className="text-body" style={{ lineHeight: 1.7 }}>
              <strong>Insight:</strong> It's often better to skip than guess.
              Even at 140/200 target, you can leave 15-20 questions unattempted.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
