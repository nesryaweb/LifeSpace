
"use client";

export default function PageLoader({ loading }) {
  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#FAF7F5]/95 backdrop-blur-sm">
      <style jsx>{`
        .notebook {
          width: 230px;
          height: 180px;
          position: relative;
          perspective: 900px;
        }

        .book-shadow {
          position: absolute;
          width: 190px;
          height: 18px;
          bottom: 10px;
          left: 20px;
          border-radius: 50%;
          background: #bba5b7;
          opacity: 0.22;
          filter: blur(8px);
          animation: shadow 5s ease-in-out infinite;
        }

        .book-cover {
          position: absolute;
          width: 190px;
          height: 132px;
          left: 20px;
          top: 22px;
          border-radius: 8px 13px 13px 8px;
          background: #b88fae;
          transform: rotate(-5deg);
          box-shadow: 0 8px 18px #80647b35;
        }

        .page {
          position: absolute;
          width: 180px;
          height: 126px;
          left: 24px;
          top: 19px;
          border-radius: 5px 10px 10px 5px;
          background: #fffdfb;
          transform-origin: left center;
          box-shadow: 2px 3px 8px #80647b20;
        }

        .page-back {
          transform: rotate(-3deg);
          background: #f2e8ef;
        }

        .page-main {
          overflow: hidden;
          transform: rotate(-3deg);
          animation: openPage 5s ease-in-out infinite;
        }

        .spine {
          position: absolute;
          left: 17px;
          top: 2px;
          height: 122px;
          width: 7px;
          background: #e6c9da;
          border-radius: 5px;
        }

        .page-line {
          position: absolute;
          left: 37px;
          height: 3px;
          border-radius: 5px;
          background: #eadfe8;
          transform: scaleX(0);
          transform-origin: left;
          animation: drawLine 5s ease-in-out infinite;
        }

        .line-one {
          top: 43px;
          width: 95px;
          animation-delay: 0.9s;
        }

        .line-two {
          top: 54px;
          width: 125px;
          animation-delay: 1.1s;
        }

        .line-three {
          top: 65px;
          width: 110px;
          animation-delay: 1.3s;
        }

        .line-four {
          top: 76px;
          width: 80px;
          animation-delay: 1.5s;
        }

        .sticky-note {
          position: absolute;
          width: 39px;
          height: 35px;
          right: 18px;
          top: 47px;
          background: #f6d8e4;
          border-radius: 3px;
          transform: rotate(8deg) scale(0);
          box-shadow: 1px 2px 4px #9b789020;
          animation: stickerIn 5s ease-in-out infinite;
          animation-delay: 1.7s;
        }

        .sticky-note::after {
          content: "";
          position: absolute;
          width: 20px;
          height: 2px;
          background: #d9a9bf;
          left: 9px;
          top: 13px;
          box-shadow: 0 6px 0 #d9a9bf;
        }

        .flower {
          position: absolute;
          right: 35px;
          bottom: 15px;
          font-size: 21px;
          transform: scale(0) rotate(-40deg);
          animation: flowerIn 5s ease-in-out infinite;
          animation-delay: 2s;
        }

        .tab {
          position: absolute;
          width: 35px;
          height: 13px;
          top: 12px;
          right: 37px;
          border-radius: 5px 5px 0 0;
          background: #c7d9c6;
          opacity: 0;
          animation: tabIn 5s ease-in-out infinite;
          animation-delay: 0.5s;
        }

        .sparkle {
          position: absolute;
          color: #c39ab6;
          font-size: 17px;
          opacity: 0;
          animation: twinkle 1.8s ease-in-out infinite;
        }

        .sparkle-one {
          top: 12px;
          left: 15px;
          animation-delay: 0.3s;
        }

        .sparkle-two {
          top: 45px;
          right: 5px;
          animation-delay: 0.9s;
        }

        .sparkle-three {
          bottom: 25px;
          left: 5px;
          animation-delay: 1.4s;
        }

        .loader-caption {
          margin-top: 20px;
          color: #8e7589;
          font-size: 13px;
          letter-spacing: 0.04em;
          animation: captionPulse 1.8s ease-in-out infinite;
        }

        .loader-track {
          width: 130px;
          height: 3px;
          margin: 13px auto 0;
          overflow: hidden;
          border-radius: 10px;
          background: #eadfe8;
        }

        .loader-progress {
          width: 45%;
          height: 100%;
          border-radius: 10px;
          background: #c394b3;
          animation: progress 1.5s ease-in-out infinite;
        }

        /* The notebook resets and rebuilds every 5 seconds */

        @keyframes openPage {
          0%, 8% {
            transform: rotateY(-75deg) rotate(-3deg);
          }
          22%, 78% {
            transform: rotateY(0) rotate(-3deg);
          }
          92%, 100% {
            transform: rotateY(-75deg) rotate(-3deg);
          }
        }

        @keyframes drawLine {
          0%, 18% {
            transform: scaleX(0);
          }
          30%, 78% {
            transform: scaleX(1);
          }
          90%, 100% {
            transform: scaleX(0);
          }
        }

        @keyframes tabIn {
          0%, 12% {
            opacity: 0;
            transform: translateY(12px);
          }
          22%, 78% {
            opacity: 1;
            transform: translateY(0);
          }
          90%, 100% {
            opacity: 0;
            transform: translateY(12px);
          }
        }

        @keyframes stickerIn {
          0%, 30% {
            transform: rotate(8deg) scale(0);
          }
          42%, 78% {
            transform: rotate(8deg) scale(1);
          }
          90%, 100% {
            transform: rotate(8deg) scale(0);
          }
        }

        @keyframes flowerIn {
          0%, 36% {
            transform: scale(0) rotate(-40deg);
          }
          48%, 78% {
            transform: scale(1) rotate(8deg);
          }
          90%, 100% {
            transform: scale(0) rotate(-40deg);
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0.5) rotate(0);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) rotate(20deg);
          }
        }

        @keyframes captionPulse {
          0%, 100% {
            opacity: 0.65;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes progress {
          0% {
            transform: translateX(-110%);
          }
          100% {
            transform: translateX(250%);
          }
        }

        @keyframes shadow {
          0%, 100% {
            transform: scaleX(0.9);
            opacity: 0.18;
          }
          50% {
            transform: scaleX(1.05);
            opacity: 0.28;
          }
        }
      `}</style>

      <div className="flex flex-col items-center">
        <div className="notebook">
          <div className="book-shadow" />
          <div className="book-cover" />
          <div className="page page-back" />

          <div className="page page-main">
            <div className="spine" />
            <div className="page-line line-one" />
            <div className="page-line line-two" />
            <div className="page-line line-three" />
            <div className="page-line line-four" />
            <div className="sticky-note" />
            <div className="flower">✿</div>
          </div>

          <div className="tab" />
          <span className="sparkle sparkle-one">✦</span>
          <span className="sparkle sparkle-two">✧</span>
          <span className="sparkle sparkle-three">✦</span>
        </div>

        <p className="loader-caption">Putting your little world together...</p>

        <div className="loader-track">
          <div className="loader-progress" />
        </div>
      </div>
    </div>
  );
}
