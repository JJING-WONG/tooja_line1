import placement from "../../../assets/Placement.svg";
import BoothItem from "./BoothItem";
import type { Booth } from "./BoothItem";

// Figma의 행사장 위치. 응답 배열 순서 대신 teamId로 부스를 배치합니다.
const columns = [
  { x: 44.667, ids: [1, 2, 3, 4, 5] },
  { x: 116.133, ids: [10, 9, 8, 7, 6] },
  { x: 169.733, ids: [11, 12, 13, 14, 15] },
  { x: 240.083, ids: [20, 19, 18, 17, 16] },
];
const rows = [109.433, 160.8, 213.283, 265.767, 317.133];

export default function BoothMap({
  teams,
  isStaff,
  isCompleted,
  isPaused = false,
}: {
  teams: Booth[];
  isStaff: boolean;
  isCompleted: boolean;
  isPaused?: boolean;
}) {
  return (
    <section aria-labelledby="booth-list-title">
      <div className="mb-3 flex h-5.25 items-center justify-between">
        <h2
          id="booth-list-title"
          className="text-[15px] font-bold leading-5.25 text-[#222]"
        >
          부스 목록
        </h2>
        <p className="w-11.75 text-[12px] leading-4.25 text-[#888] font-['Noto_Sans_KR', sans-serif]">
          {teams.length}개 팀
        </p>
      </div>
      <div className="relative aspect-336/402 w-full @container">
        <div className="absolute inset-[0.5px]">
          <img src={placement} alt="" className="block" />
          <ul aria-label="행사장 부스 배치도">
            {columns.flatMap((column) =>
              column.ids.map((id, row) => {
                const team = teams.find((item) => item.teamId === id);
                if (!team) return null;
                return (
                  <li
                    key={id}
                    className="absolute"
                    style={{
                      left: `${((id === 6 ? 115.017 : column.x) / 335) * 100}%`,
                      top: `${(rows[row] / 401) * 100}%`,
                      width: `${(50.25 / 335) * 100}%`,
                      height: `${(40.2 / 401) * 100}%`,
                    }}
                  >
                    <BoothItem
                      team={team}
                      isStaff={isStaff}
                      isCompleted={isCompleted}
                    />
                  </li>
                );
              }),
            )}
          </ul>
          {isPaused && (
            <div
              role="status"
              className="pointer-events-none absolute inset-0 rounded-[10px] bg-black/70 text-center text-[16.607px] font-bold leading-5.75 text-[#fdfdfd] font-['Noto_Sans_KR', sans-serif]"
            >
              <p
                className="absolute h-11.5 w-[calc(100%+1px)]"
                style={{
                  left: `${(4 / 335) * 100}%`,
                  top: `${(184 / 401) * 100}%`,
                }}
              >
                지금은 투자가
                <br />
                일시정지되어 있어요
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
