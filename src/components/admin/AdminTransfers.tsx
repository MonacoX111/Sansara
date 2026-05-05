import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { Player, Team, Transfer, TransferType } from "../../types";
import SearchableSelect, {
  SearchableOption,
} from "../ui/SearchableSelect";
import PremiumSelect from "../ui/PremiumSelect";

type ConfirmDeleteState = {
  open: boolean;
  type: "player" | "team" | "tournament" | "match" | "achievement" | null;
  achievementId?: number;
};

type Props = {
  adminText: Record<string, string>;
  commonText: Record<string, string>;
  players: Player[];
  teams: Team[];
  transfers: Transfer[];
  addTransfer: (transfer: Omit<Transfer, "id">) => void | Promise<void>;
  deleteTransfer: (id: number) => void | Promise<void>;
  isAdminActionLoading: (key: string) => boolean;
  runAdminAction: (key: string, action: () => void | Promise<void>) => void;
  setConfirmDelete: Dispatch<SetStateAction<ConfirmDeleteState>>;
};

export default function AdminTransfers({
  adminText,
  commonText,
  players,
  teams,
  transfers,
  addTransfer,
  deleteTransfer,
  isAdminActionLoading,
  runAdminAction,
}: Props) {
  const [player, setPlayer] = useState<SearchableOption | null>(null);
  const [fromTeam, setFromTeam] = useState<SearchableOption | null>(null);
  const [toTeam, setToTeam] = useState<SearchableOption | null>(null);
  const [date, setDate] = useState<string>("");
  const [transferType, setTransferType] = useState<TransferType>("transfer");

  const freeAgentOption: SearchableOption = {
    value: null,
    label: adminText.transferFreeAgent,
  };

  const playerOptions: SearchableOption[] = useMemo(
    () =>
      players.map((p) => ({
        value: p.id,
        label: p.nickname,
        avatar: p.avatar,
      })),
    [players]
  );

  const teamOptions: SearchableOption[] = useMemo(
    () => [
      freeAgentOption,
      ...teams.map((team) => ({
        value: team.id,
        label: team.name,
        avatar: team.logo,
      })),
    ],
    [teams, adminText.transferFreeAgent]
  );

  const sortedTransfers = useMemo(
    () =>
      [...transfers].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [transfers]
  );

  const playerNameById = (id: number) =>
    players.find((p) => p.id === id)?.nickname || `#${id}`;

  const teamNameById = (id: number | null) => {
    if (id === null || id === 0) return adminText.transferFreeAgent;
    return (
      teams.find((team) => team.id === id)?.name ||
      adminText.transferFreeAgent
    );
  };

  const handleAdd = () => {
    runAdminAction("create-transfer", async () => {
      await addTransfer({
        playerId: Number(player?.value || 0),
        fromTeamId:
          fromTeam && fromTeam.value !== null ? Number(fromTeam.value) : null,
        toTeamId:
          toTeam && toTeam.value !== null ? Number(toTeam.value) : null,
        date,
        type: transferType,
      });
      setPlayer(null);
      setFromTeam(null);
      setToTeam(null);
      setDate("");
      setTransferType("transfer");
    });
  };

  return (
    <div id="admin-section-transfers" className="two-col reverse">
      <div className="panel">
        <h2 className="panel-title">{adminText.transfers}</h2>

        <div className="form-col">
          <div className="field-block">
            <label className="field-label">{adminText.transferPlayer}</label>
              <SearchableSelect
                value={player}
                options={playerOptions}
                onChange={setPlayer}
                placeholder={adminText.selectPlayer}
                searchPlaceholder={adminText.searchPlaceholder}
                emptyLabel={commonText.noResults}
              />
          </div>

          <div className="form-grid">
            <div className="field-block">
              <label className="field-label">{adminText.transferFrom}</label>
              <SearchableSelect
                value={fromTeam ?? freeAgentOption}
                options={teamOptions}
                onChange={setFromTeam}
                placeholder={adminText.transferFreeAgent}
                searchPlaceholder={adminText.searchPlaceholder}
                emptyLabel={commonText.noResults}
              />
            </div>

            <div className="field-block">
              <label className="field-label">{adminText.transferTo}</label>
              <SearchableSelect
                value={toTeam ?? freeAgentOption}
                options={teamOptions}
                onChange={setToTeam}
                placeholder={adminText.transferFreeAgent}
                searchPlaceholder={adminText.searchPlaceholder}
                emptyLabel={commonText.noResults}
              />
            </div>
          </div>

          <div className="field-block">
            <label className="field-label">{adminText.transferType}</label>
            <PremiumSelect
              value={transferType}
              placeholder={adminText.transferType}
              includePlaceholderOption={false}
              onChange={(value) => setTransferType(value as TransferType)}
              options={[
                { value: "transfer", label: adminText.transferTypeTransfer },
                { value: "loan", label: adminText.transferTypeLoan },
              ]}
            />
          </div>

          <div className="field-block">
            <label className="field-label">{adminText.transferDate}</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="btn-row">
            <button
              className="primary-btn"
              disabled={isAdminActionLoading("create-transfer")}
              onClick={handleAdd}
            >
                {isAdminActionLoading("create-transfer")
                  ? commonText.saving
                  : adminText.addTransfer}
              </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">{adminText.transfers}</h2>

        <div className="form-col">
          {sortedTransfers.length === 0 ? (
            <div className="muted-state">{adminText.noTransfers}</div>
          ) : (
            <div className="list-col admin-scroll-list">
              {sortedTransfers.map((transfer) => {
                const loadingKey = `delete-transfer-${transfer.id}`;
                const isDeleting = isAdminActionLoading(loadingKey);

                return (
                  <div
                    key={transfer.id}
                    className="admin-list-btn"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong>
                        {playerNameById(transfer.playerId)}
                        {(transfer.type ?? "transfer") === "loan" ? (
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: 11,
                              opacity: 0.8,
                            }}
                          >
                            ({adminText.transferTypeLoan})
                          </span>
                        ) : null}
                      </strong>
                      <span style={{ opacity: 0.75, fontSize: 13 }}>
                        {teamNameById(transfer.fromTeamId)}
                        {" \u2192 "}
                        {teamNameById(transfer.toTeamId)}
                      </span>
                      <small style={{ opacity: 0.6 }}>{transfer.date}</small>
                    </div>

                    <button
                      type="button"
                      className="danger-btn"
                      disabled={isDeleting}
                      onClick={() =>
                        runAdminAction(loadingKey, async () => {
                          await deleteTransfer(transfer.id);
                        })
                      }
                    >
                      {isDeleting ? "..." : commonText.delete}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
