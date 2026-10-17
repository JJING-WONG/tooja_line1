import track from "../../assets/LoadingTrack.svg";
import arc from "../../assets/LoadingArc.png";
import cap from "../../assets/LoadingCap.svg";

export default function LoadingOverlay() {
  return (
    <div
      role="status"
      aria-label="불러오는 중"
      className="fixed inset-y-0 left-1/2 z-40 w-full max-w-93.75 -translate-x-1/2 bg-white/70"
    >
      {/* 375×812 시안 기준 x=146, y=360. 다른 화면 높이에서는 중앙 기준 간격 유지. */}
      <div
        aria-hidden="true"
        className="absolute left-[calc(50%-41.5px)] top-[calc(50%-46px)] size-18.75 motion-safe:animate-spin"
      >
        <div className="absolute left-0 top-0 origin-top-left scale-[2.34375]">
          <img src={track} alt="" />
        </div>
        <img
          src={arc}
          width={75}
          height={75}
          alt=""
          className="absolute left-0 top-0 -rotate-90"
        />
        <img
          src={cap}
          alt=""
          className="absolute left-[65.63px] top-[32.45px] -rotate-90"
        />
      </div>
      <p className="absolute left-[calc(50%-44.5px)] top-[calc(50%+40px)] h-6 w-22.5 text-[18px] font-medium leading-6 text-black">
        Loading ...
      </p>
    </div>
  );
}
