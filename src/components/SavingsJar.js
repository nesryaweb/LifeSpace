"use client";

import { useId } from "react";
import { Coins, Sparkles, Target } from "lucide-react";

const COIN_ROWS = [
  { y: 263, count: 3 },
  { y: 245, count: 4 },
  { y: 227, count: 3 },
  { y: 209, count: 4 },
  { y: 191, count: 3 },
  { y: 173, count: 4 },
  { y: 155, count: 3 },
  { y: 137, count: 4 },
  { y: 119, count: 3 },
  { y: 101, count: 4 },
];

const COINS = COIN_ROWS.flatMap((row, rowIndex) => {
  const spacing = 29;
  const startX = 120 - ((row.count - 1) * spacing) / 2;

  return Array.from({ length: row.count }, (_, i) => ({
    id: `${rowIndex}-${i}`,
    x: startX + i * spacing,
    y: row.y,
    radius: 11 + ((rowIndex + i) % 2),
  }));
});

export default function SavingsJar({
  title = "Savings jar",
  currentAmount = 0,
  targetAmount = 0,
  currency = "ETB",
  progress,
  compact = false,
}) {
  const rawId = useId();
  const jarId = rawId.replace(/:/g, "");

  const current = Math.max(0, Number(currentAmount) || 0);
  const target = Math.max(0, Number(targetAmount) || 0);
  const hasTarget = target > 0;

  const calculatedProgress = hasTarget
    ? (current / target) * 100
    : 0;

  const suppliedProgress =
    progress !== undefined && progress !== null
      ? Number(progress)
      : NaN;

  const fillPercentage = Math.min(
    100,
    Math.max(
      0,
      Number.isFinite(suppliedProgress)
        ? suppliedProgress
        : calculatedProgress
    )
  );

  const remaining = Math.max(0, target - current);
  const fillY = 276 - (fillPercentage / 100) * 227;

  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    }).format(amount);

  const markers = [25, 50, 75, 100];

  return (
    <section
      className={`savings-jar-card ${compact ? "savings-jar-compact" : ""}`}
      aria-label={
        hasTarget
          ? `${title}: ${formatMoney(current)} ${currency} saved out of ${formatMoney(target)} ${currency}`
          : `${title}: ${formatMoney(current)} ${currency} saved. No target set.`
      }
    >
      <div className="jar-card-heading">
        <div className="jar-heading-icon">
          <Coins size={18} aria-hidden="true" />
        </div>

        <div className="jar-heading-text">
          <h3>{title}</h3>
          <p>Your savings progress</p>
        </div>

        <div className="jar-percentage">
          {hasTarget ? `${Math.round(fillPercentage)}%` : "No target"}
        </div>
      </div>

      <div className="jar-visual-area">
        {hasTarget && (
          <div className="jar-markers" aria-hidden="true">
            {markers.map((marker) => (
              <div className="jar-marker" key={marker}>
                <span
                  className={
                    fillPercentage >= marker
                      ? "jar-marker-line reached"
                      : "jar-marker-line"
                  }
                />
                <span
                  className={
                    fillPercentage >= marker
                      ? "jar-marker-label reached"
                      : "jar-marker-label"
                  }
                >
                  {marker}%
                </span>
              </div>
            ))}
          </div>
        )}

        <svg
          className="savings-jar-svg"
          viewBox="0 0 240 300"
          role="img"
          aria-label={
            hasTarget
              ? `${title} savings jar, ${Math.round(fillPercentage)} percent full`
              : `${title} savings jar, no target set`
          }
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <clipPath
              id={`jar-interior-${jarId}`}
              clipPathUnits="userSpaceOnUse"
            >
              <path d="M63 65 C63 55 72 49 83 49 H157 C168 49 177 55 177 65 L185 250 C185 265 174 276 159 276 H81 C66 276 55 265 55 250 Z" />
            </clipPath>

            <clipPath
              id={`jar-content-${jarId}`}
              clipPathUnits="userSpaceOnUse"
            >
              <rect
                className="jar-content-clip"
                x="55"
                y={fillY}
                width="130"
                height={Math.max(0, 276 - fillY)}
              />
            </clipPath>

            <linearGradient
              id={`jar-glass-${jarId}`}
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.82" />
              <stop offset="48%" stopColor="#F5DDE8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#DCC7E9" stopOpacity="0.48" />
            </linearGradient>

            <linearGradient
              id={`jar-gold-${jarId}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#FFF4D2" />
              <stop offset="35%" stopColor="#EED59A" />
              <stop offset="75%" stopColor="#D9B66D" />
              <stop offset="100%" stopColor="#BE9450" />
            </linearGradient>

            <linearGradient
              id={`jar-coin-edge-${jarId}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#D9B66D" />
              <stop offset="100%" stopColor="#A9844C" />
            </linearGradient>

            <linearGradient
              id={`jar-lid-${jarId}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#D7B8D9" />
              <stop offset="100%" stopColor="#B995C2" />
            </linearGradient>
          </defs>

          <ellipse
            cx="120"
            cy="282"
            rx="77"
            ry="8"
            fill="#A991B5"
            opacity="0.17"
          />

          {/* Lid */}
          <rect
            x="75"
            y="27"
            width="90"
            height="19"
            rx="6"
            fill={`url(#jar-lid-${jarId})`}
            stroke="#A984B4"
            strokeWidth="2"
          />

          <path
            d="M82 33 H158"
            stroke="#F8EAF3"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Jar neck */}
          <path
            d="M68 48 H172 V65 H68 Z"
            fill="#E9DDF0"
            fillOpacity="0.4"
            stroke="#B995C5"
            strokeWidth="2"
          />

          {/* Coins fill from the bottom according to actual savings progress */}
          <g clipPath={`url(#jar-interior-${jarId})`}>
            <g clipPath={`url(#jar-content-${jarId})`}>
              {COINS.map((coin) => (
                <g
                  key={coin.id}
                  transform={`translate(${coin.x} ${coin.y})`}
                >
                  {/* Coin edge */}
                  <rect
                    x={-coin.radius}
                    y="-5"
                    width={coin.radius * 2}
                    height="9"
                    rx="3"
                    fill={`url(#jar-coin-edge-${jarId})`}
                    stroke="#B28D52"
                    strokeWidth="0.7"
                  />

                  {/* Coin face */}
                  <ellipse
                    cx="0"
                    cy="-5"
                    rx={coin.radius}
                    ry="5"
                    fill={`url(#jar-gold-${jarId})`}
                    stroke="#C5A265"
                    strokeWidth="0.9"
                  />

                  {/* Delicate coin detail */}
                  <ellipse
                    cx="0"
                    cy="-5"
                    rx={coin.radius * 0.65}
                    ry="2.7"
                    fill="none"
                    stroke="#FFF8E8"
                    strokeWidth="1"
                    opacity="0.9"
                  />

                  <path
                    d={`M-${coin.radius * 0.3} -5 H${coin.radius * 0.3}`}
                    stroke="#C09A5C"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                  />
                </g>
              ))}
            </g>
          </g>

          {/* Glass body */}
          <path
            d="M63 65 C63 55 72 49 83 49 H157 C168 49 177 55 177 65 L185 250 C185 265 174 276 159 276 H81 C66 276 55 265 55 250 Z"
            fill={`url(#jar-glass-${jarId})`}
            stroke="#B995C5"
            strokeWidth="3"
          />

          {/* Glass reflections */}
          <path
            d="M70 82 L65 230"
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.8"
          />

          <path
            d="M82 65 L79 105"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
          />

          <path
            d="M169 105 L174 220"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.55"
          />

          {/* Sparkles */}
          <path
            d="M190 86 L193 94 L201 97 L193 100 L190 108 L187 100 L179 97 L187 94 Z"
            fill="#D7B5D9"
          />

          <path
            d="M44 145 L46 151 L52 153 L46 155 L44 161 L42 155 L36 153 L42 151 Z"
            fill="#E7B6CE"
          />
        </svg>
      </div>

      <div className="jar-balance">
        <div>
          <span className="jar-small-label">Saved so far</span>
          <strong>
            {formatMoney(current)} <small>{currency}</small>
          </strong>
        </div>

        <div className="jar-target">
          <span className="jar-small-label">Target</span>
          <strong>
            {hasTarget ? (
              <>
                {formatMoney(target)} <small>{currency}</small>
              </>
            ) : (
              "Not set"
            )}
          </strong>
        </div>
      </div>

      {hasTarget && (
        <div
          className="jar-progress-track"
          role="progressbar"
          aria-label={`${title} savings progress`}
          aria-valuenow={Math.round(fillPercentage)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="jar-progress-fill"
            style={{ width: `${fillPercentage}%` }}
          />
        </div>
      )}

      <div className="jar-footer">
        {!hasTarget ? (
          <span>
            <Target size={14} />
            Set a target amount to track progress
          </span>
        ) : fillPercentage >= 100 ? (
          <span className="jar-complete-message">
            <Sparkles size={15} />
            Savings goal reached!
          </span>
        ) : (
          <span>
            <Target size={14} />
            {formatMoney(remaining)} {currency} left to save
          </span>
        )}
      </div>

      <style jsx>{`
        .savings-jar-card {
          width: 100%;
          min-width: 0;
          padding: 22px;
          border: 1px solid #f0dce8;
          border-radius: 22px;
          background: linear-gradient(145deg, #fffdfd, #fff7fb);
          color: #55465b;
          overflow: hidden;
        }

        .jar-card-heading {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .jar-heading-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          color: #a56f9e;
          background: #f6e7f1;
          flex-shrink: 0;
        }

        .jar-heading-text {
          flex: 1;
          min-width: 0;
        }

        .jar-heading-text h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 650;
          overflow-wrap: anywhere;
        }

        .jar-heading-text p {
          margin: 3px 0 0;
          font-size: 12px;
          color: #a18e9f;
        }

        .jar-percentage {
          padding: 7px 11px;
          border-radius: 20px;
          background: #f4e6f1;
          color: #966b9c;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .jar-visual-area {
          width: 100%;
          height: 290px;
          max-width: 310px;
          margin: 10px auto 0;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .savings-jar-svg {
          display: block;
          width: min(100%, 240px);
          height: 100%;
          overflow: visible;
        }

        .jar-content-clip {
          transition:
            y 900ms cubic-bezier(0.2, 0.7, 0.2, 1),
            height 900ms cubic-bezier(0.2, 0.7, 0.2, 1);
        }

        .jar-markers {
          position: absolute;
          right: 0;
          top: 42px;
          bottom: 16px;
          display: flex;
          flex-direction: column-reverse;
          justify-content: space-between;
          z-index: 2;
          pointer-events: none;
        }

        .jar-marker {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .jar-marker-line {
          width: 14px;
          height: 1px;
          background: #d8c5d5;
        }

        .jar-marker-line.reached {
          height: 2px;
          background: #b47ba9;
        }

        .jar-marker-label {
          font-size: 10px;
          color: #b4a2b2;
        }

        .jar-marker-label.reached {
          color: #986c9b;
          font-weight: 700;
        }

        .jar-balance {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 4px;
        }

        .jar-balance > div {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
        }

        .jar-target {
          text-align: right;
          align-items: flex-end;
        }

        .jar-small-label {
          color: #a28e9f;
          font-size: 11px;
        }

        .jar-balance strong {
          font-size: 17px;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .jar-balance strong small {
          font-size: 11px;
          font-weight: 500;
          color: #a28e9f;
        }

        .jar-progress-track {
          height: 8px;
          margin-top: 17px;
          border-radius: 20px;
          background: #f0e5ed;
          overflow: hidden;
        }

        .jar-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #d99ab9, #b68fc7);
          transition: width 900ms cubic-bezier(0.2, 0.7, 0.2, 1);
        }

        .jar-footer {
          display: flex;
          align-items: center;
          margin-top: 12px;
          color: #9c849b;
          font-size: 12px;
        }

        .jar-footer span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .jar-complete-message {
          color: #9a719d;
          font-weight: 650;
        }

        .savings-jar-compact {
          padding: 16px;
        }

        .savings-jar-compact .jar-visual-area {
          height: 230px;
        }

        .savings-jar-compact .savings-jar-svg {
          width: min(100%, 205px);
        }

        @media (max-width: 420px) {
          .savings-jar-card {
            padding: 16px;
          }

          .jar-visual-area {
            height: 250px;
          }

          .savings-jar-svg {
            width: min(100%, 220px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .jar-content-clip,
          .jar-progress-fill {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}