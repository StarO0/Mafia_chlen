package com.mafia.assistant.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mafia.assistant.domain.Game;
import com.mafia.assistant.domain.GameLog;
import com.mafia.assistant.domain.GameResult;
import com.mafia.assistant.domain.Player;
import com.mafia.assistant.domain.enums.EventType;
import com.mafia.assistant.domain.enums.GameStatus;
import com.mafia.assistant.domain.enums.PhaseType;
import com.mafia.assistant.domain.enums.PlayerRole;
import com.mafia.assistant.domain.enums.WinnerSide;
import com.mafia.assistant.repository.GameLogRepository;
import com.mafia.assistant.repository.GameRepository;
import com.mafia.assistant.repository.GameResultRepository;
import com.mafia.assistant.repository.PlayerRepository;
import com.mafia.assistant.web.dto.AssignRolesRequest;
import com.mafia.assistant.web.dto.CreateGameRequest;
import com.mafia.assistant.web.dto.GameLogResponse;
import com.mafia.assistant.web.dto.GameResponse;
import com.mafia.assistant.web.dto.GameResultResponse;
import com.mafia.assistant.web.dto.GameSummaryResponse;
import com.mafia.assistant.web.dto.NightResolutionRequest;
import com.mafia.assistant.web.dto.PlayerActionRequest;
import com.mafia.assistant.web.dto.PlayerResponse;
import com.mafia.assistant.web.dto.RoleAssignmentItem;
import com.mafia.assistant.web.dto.UpdateRolesRequest;
import com.mafia.assistant.web.dto.VoteCastRequest;
import com.mafia.assistant.web.dto.VoteNominationRequest;
import com.mafia.assistant.web.error.BadRequestException;
import com.mafia.assistant.web.error.NotFoundException;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class GameService {
    private final GameRepository gameRepository;
    private final PlayerRepository playerRepository;
    private final GameLogRepository gameLogRepository;
    private final GameResultRepository gameResultRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GameService(
            GameRepository gameRepository,
            PlayerRepository playerRepository,
            GameLogRepository gameLogRepository,
            GameResultRepository gameResultRepository
    ) {
        this.gameRepository = gameRepository;
        this.playerRepository = playerRepository;
        this.gameLogRepository = gameLogRepository;
        this.gameResultRepository = gameResultRepository;
    }

    @Transactional
    public GameResponse createGame(CreateGameRequest request) {
        if (request.playerNames().size() != request.playerCount()) {
            throw new BadRequestException("playerNames size must equal playerCount");
        }
        int totalPlayers = request.playerCount();
        int mafiaCount = Math.max(1, totalPlayers / 4);
        int donCount = 1;
        int sheriffCount = 1;
        int citizenCount = totalPlayers - mafiaCount - donCount - sheriffCount;
        if (citizenCount < 1) {
            throw new BadRequestException("Cannot calculate valid base roles for selected player count");
        }

        Game game = new Game();
        game.setStatus(GameStatus.SETUP);
        game.setPhase(PhaseType.NIGHT);
        game.setCurrentDayNumber(1);
        game.setTotalPlayers(totalPlayers);
        game.setMafiaCount(mafiaCount);
        game.setDonCount(donCount);
        game.setSheriffCount(sheriffCount);
        game.setCitizenCount(citizenCount);

        for (int i = 0; i < request.playerNames().size(); i++) {
            Player player = new Player();
            player.setGame(game);
            player.setSeatIndex(i + 1);
            player.setName(request.playerNames().get(i).trim());
            game.getPlayers().add(player);
        }

        Game saved = gameRepository.save(game);
        appendLog(saved, EventType.GAME_CREATED, "Создана новая игра");
        return getGame(saved.getId());
    }

    @Transactional
    public GameResponse updateRoles(Long gameId, UpdateRolesRequest request) {
        Game game = getExistingGame(gameId);
        assertSetupPhase(game);
        if (request.mafiaCount() != null) game.setMafiaCount(request.mafiaCount());
        if (request.donCount() != null) game.setDonCount(request.donCount());
        if (request.sheriffCount() != null) game.setSheriffCount(request.sheriffCount());
        if (request.citizenCount() != null) game.setCitizenCount(request.citizenCount());
        if (request.customRolesJson() != null) game.setCustomRolesJson(request.customRolesJson());
        if (request.paperRolesEnabled() != null) game.setPaperRolesEnabled(request.paperRolesEnabled());
        int totalBaseRoles = game.getMafiaCount() + game.getDonCount() + game.getSheriffCount() + game.getCitizenCount();
        if (totalBaseRoles > game.getTotalPlayers()) throw new BadRequestException("Base role count cannot exceed total players");
        appendLog(game, EventType.ROLE_ASSIGNED, "Обновлены настройки ролей");
        return getGame(gameId);
    }

    @Transactional
    public GameResponse assignRoles(Long gameId, AssignRolesRequest request) {
        Game game = getExistingGame(gameId);
        assertSetupPhase(game);
        List<Player> players = playerRepository.findByGameIdOrderBySeatIndexAsc(gameId);
        if (request.assignments().size() != players.size()) throw new BadRequestException("Assignments count must match players count");
        Map<Integer, Player> playerBySeat = players.stream().collect(Collectors.toMap(Player::getSeatIndex, Function.identity()));
        for (RoleAssignmentItem assignment : request.assignments()) {
            Player player = playerBySeat.get(assignment.seatIndex());
            if (player == null) throw new BadRequestException("No player found for seat " + assignment.seatIndex());
            player.setRole(assignment.role());
            player.setCustomRoleName(assignment.customRoleName());
        }
        playerRepository.saveAll(players);
        appendLog(game, EventType.ROLE_ASSIGNED, "Назначены роли игрокам");
        return getGame(gameId);
    }

    @Transactional
    public GameResponse startGame(Long gameId) {
        Game game = getExistingGame(gameId);
        assertSetupPhase(game);
        List<Player> players = playerRepository.findByGameIdOrderBySeatIndexAsc(gameId);
        long withRole = players.stream().filter(player -> player.getRole() != null).count();
        if (withRole != players.size()) throw new BadRequestException("All players must have roles before game start");
        game.setStatus(GameStatus.ACTIVE);
        game.setPhase(PhaseType.NIGHT);
        game.setCurrentDayNumber(1);
        game.setSpeakerSeatIndex(players.isEmpty() ? null : players.getFirst().getSeatIndex());
        appendLog(game, EventType.GAME_STARTED, "Игра началась");
        return getGame(gameId);
    }

    @Transactional
    public GameResponse togglePhase(Long gameId) {
        Game game = getActiveGame(gameId);
        saveSnapshotLog(game, EventType.PHASE_CHANGED, "Переключение фазы");
        if (game.getPhase() == PhaseType.NIGHT) {
            game.setPhase(PhaseType.DAY);
            game.setCurrentDayNumber(game.getCurrentDayNumber() + 1);
        } else {
            game.setPhase(PhaseType.NIGHT);
        }
        setNextAliveSpeaker(game, playerRepository.findByGameIdOrderBySeatIndexAsc(gameId));
        appendLog(game, EventType.PHASE_CHANGED, "Фаза: " + game.getPhase());
        checkWinner(game, playerRepository.findByGameIdOrderBySeatIndexAsc(gameId));
        return getGame(gameId);
    }

    @Transactional
    public GameResponse nextSpeaker(Long gameId) {
        Game game = getActiveGame(gameId);
        List<Player> players = playerRepository.findByGameIdOrderBySeatIndexAsc(gameId);
        saveSnapshotLog(game, EventType.NOTE, "Смена выступающего");
        setNextAliveSpeaker(game, players);
        appendLog(game, EventType.NOTE, "Следующий выступающий: место " + game.getSpeakerSeatIndex());
        return getGame(gameId);
    }

    @Transactional
    public GameResponse eliminatePlayer(Long gameId, Integer seatIndex, PlayerActionRequest request) {
        Game game = getActiveGame(gameId);
        List<Player> players = playerRepository.findByGameIdOrderBySeatIndexAsc(gameId);
        Player player = getPlayerBySeat(players, seatIndex);
        boolean force = request != null && Boolean.TRUE.equals(request.force());
        if (!player.isAlive() && !force) throw new BadRequestException("WARNING: Игрок уже мертв. Подтвердите действие.");
        if (game.getPhase() == PhaseType.DAY && wasSavedByDoctorLastNight(gameId, seatIndex) && !force) {
            throw new BadRequestException("WARNING: Этот игрок был вылечен ночью. Подтвердите действие.");
        }
        saveSnapshotLog(game, EventType.PLAYER_ELIMINATED, "Исключение игрока " + seatIndex);
        player.setAlive(false);
        player.setEliminatedAt(Instant.now());
        playerRepository.save(player);
        appendLog(game, EventType.PLAYER_ELIMINATED, "Игрок " + seatIndex + " исключен");
        checkWinner(game, players);
        return getGame(gameId);
    }

    @Transactional
    public GameResponse restorePlayer(Long gameId, Integer seatIndex) {
        Game game = getActiveGame(gameId);
        List<Player> players = playerRepository.findByGameIdOrderBySeatIndexAsc(gameId);
        Player player = getPlayerBySeat(players, seatIndex);
        saveSnapshotLog(game, EventType.PLAYER_RESTORED, "Восстановление игрока " + seatIndex);
        player.setAlive(true);
        player.setEliminatedAt(null);
        playerRepository.save(player);
        appendLog(game, EventType.PLAYER_RESTORED, "Игрок " + seatIndex + " восстановлен");
        return getGame(gameId);
    }

    @Transactional
    public GameResponse nominateForVote(Long gameId, VoteNominationRequest request) {
        Game game = getActiveGame(gameId);
        List<Player> players = playerRepository.findByGameIdOrderBySeatIndexAsc(gameId);
        Player player = getPlayerBySeat(players, request.seatIndex());
        if (!player.isAlive()) throw new BadRequestException("Нельзя выставить мертвого игрока");
        saveSnapshotLog(game, EventType.VOTE_STARTED, "Выставление игрока " + request.seatIndex());
        player.setNominatedToday(true);
        playerRepository.save(player);
        appendLog(game, EventType.VOTE_STARTED, "Выставлен игрок " + request.seatIndex());
        return getGame(gameId);
    }

    @Transactional
    public GameResponse castVote(Long gameId, VoteCastRequest request) {
        Game game = getActiveGame(gameId);
        List<Player> players = playerRepository.findByGameIdOrderBySeatIndexAsc(gameId);
        Player player = getPlayerBySeat(players, request.seatIndex());
        if (!player.isNominatedToday()) throw new BadRequestException("Игрок не выставлен на голосование");
        saveSnapshotLog(game, EventType.VOTE_CAST, "Голос за игрока " + request.seatIndex());
        player.setVotesReceivedToday(player.getVotesReceivedToday() + 1);
        playerRepository.save(player);
        appendLog(game, EventType.VOTE_CAST, "Голос за игрока " + request.seatIndex());
        return getGame(gameId);
    }

    @Transactional
    public GameResponse resetVoting(Long gameId) {
        Game game = getActiveGame(gameId);
        List<Player> players = playerRepository.findByGameIdOrderBySeatIndexAsc(gameId);
        saveSnapshotLog(game, EventType.VOTE_RESULT, "Сброс голосования");
        for (Player player : players) {
            player.setVotesReceivedToday(0);
            player.setNominatedToday(false);
        }
        playerRepository.saveAll(players);
        appendLog(game, EventType.VOTE_RESULT, "Голосование сброшено");
        return getGame(gameId);
    }

    @Transactional
    public GameResponse resolveNight(Long gameId, NightResolutionRequest request) {
        Game game = getActiveGame(gameId);
        if (game.getPhase() != PhaseType.NIGHT) throw new BadRequestException("Night wizard доступен только в фазе NIGHT");
        List<Player> players = playerRepository.findByGameIdOrderBySeatIndexAsc(gameId);
        saveSnapshotLog(game, EventType.NIGHT_ACTION, "Результат ночи");
        Integer target = request.mafiaTargetSeat();
        Integer doctorSave = request.doctorSaveSeat();
        if (target != null) {
            Player targetPlayer = getPlayerBySeat(players, target);
            if (doctorSave != null && doctorSave.equals(target)) {
                appendLogWithPayload(game, EventType.NIGHT_RESULT, "Утром никто не умер", mapToJson(Map.of("doctorSaveSeat", doctorSave, "mafiaTargetSeat", target)));
            } else {
                targetPlayer.setAlive(false);
                targetPlayer.setEliminatedAt(Instant.now());
                playerRepository.save(targetPlayer);
                appendLogWithPayload(game, EventType.NIGHT_RESULT, "Ночью убит игрок " + target, mapToJson(Map.of("doctorSaveSeat", doctorSave, "mafiaTargetSeat", target)));
            }
        }
        game.setPhase(PhaseType.DAY);
        game.setCurrentDayNumber(game.getCurrentDayNumber() + 1);
        setNextAliveSpeaker(game, players);
        checkWinner(game, players);
        return getGame(gameId);
    }

    @Transactional
    public GameResponse undoLastAction(Long gameId) {
        Game game = getActiveGame(gameId);
        GameLog snapshotLog = gameLogRepository.findByGameIdOrderBySequenceNoAsc(gameId).stream()
                .filter(GameLog::isRevertible)
                .filter(log -> log.getPayloadJson() != null && !log.getPayloadJson().isBlank())
                .max(Comparator.comparingInt(GameLog::getSequenceNo))
                .orElseThrow(() -> new BadRequestException("Нет действия для Undo"));
        applySnapshot(game, snapshotLog.getPayloadJson());
        snapshotLog.setRevertible(false);
        gameLogRepository.save(snapshotLog);
        appendLog(game, EventType.UNDO_APPLIED, "Undo применен");
        return getGame(gameId);
    }

    public List<GameSummaryResponse> getHistory() {
        return gameRepository.findTop20ByOrderByCreatedAtDesc().stream()
                .map(game -> new GameSummaryResponse(game.getId(), game.getStatus(), game.getPhase(), game.getTotalPlayers(), game.getCreatedAt()))
                .toList();
    }

    public GameResponse getGame(Long gameId) {
        Game game = getExistingGame(gameId);
        List<PlayerResponse> players = playerRepository.findByGameIdOrderBySeatIndexAsc(gameId).stream().map(this::mapPlayer).toList();
        List<GameLogResponse> logs = gameLogRepository.findByGameIdOrderBySequenceNoAsc(gameId).stream().map(this::mapLog).toList();
        GameResultResponse result = gameResultRepository.findByGameId(gameId).map(this::mapResult).orElse(null);
        return new GameResponse(
                game.getId(), game.getStatus(), game.getPhase(), game.getCurrentDayNumber(), game.getSpeakerSeatIndex(),
                game.isPaperRolesEnabled(), game.getTotalPlayers(), game.getMafiaCount(), game.getDonCount(),
                game.getSheriffCount(), game.getCitizenCount(), game.getCustomRolesJson(), game.getUndoCursor(),
                game.getCreatedAt(), game.getUpdatedAt(), players, logs, result
        );
    }

    public List<GameLogResponse> getGameLogs(Long gameId) {
        getExistingGame(gameId);
        return gameLogRepository.findByGameIdOrderBySequenceNoAsc(gameId).stream().map(this::mapLog).toList();
    }

    public GameResultResponse getGameResult(Long gameId) {
        getExistingGame(gameId);
        GameResult result = gameResultRepository.findByGameId(gameId)
                .orElseThrow(() -> new NotFoundException("Result not found for game: " + gameId));
        return mapResult(result);
    }

    private Game getExistingGame(Long gameId) {
        return gameRepository.findById(gameId).orElseThrow(() -> new NotFoundException("Game not found: " + gameId));
    }

    private Game getActiveGame(Long gameId) {
        Game game = getExistingGame(gameId);
        if (game.getStatus() != GameStatus.ACTIVE) throw new BadRequestException("Game is not ACTIVE");
        return game;
    }

    private void assertSetupPhase(Game game) {
        if (game.getStatus() != GameStatus.SETUP) throw new BadRequestException("Game is not in SETUP status");
    }

    private void appendLog(Game game, EventType eventType, String message) {
        appendLogWithPayload(game, eventType, message, null);
    }

    private void appendLogWithPayload(Game game, EventType eventType, String message, String payloadJson) {
        int nextSequence = gameLogRepository.findByGameIdOrderBySequenceNoAsc(game.getId()).stream()
                .max(Comparator.comparingInt(GameLog::getSequenceNo))
                .map(GameLog::getSequenceNo).orElse(0) + 1;
        GameLog log = new GameLog();
        log.setGame(game);
        log.setSequenceNo(nextSequence);
        log.setEventType(eventType);
        log.setMessage(message);
        log.setPayloadJson(payloadJson);
        log.setRevertible(true);
        gameLogRepository.save(log);
    }

    private void saveSnapshotLog(Game game, EventType eventType, String message) {
        appendLogWithPayload(game, eventType, message, captureSnapshot(game, playerRepository.findByGameIdOrderBySeatIndexAsc(game.getId())));
        game.setUndoCursor(game.getUndoCursor() + 1);
    }

    private String captureSnapshot(Game game, List<Player> players) {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("phase", game.getPhase().name());
        snapshot.put("day", game.getCurrentDayNumber());
        snapshot.put("speaker", game.getSpeakerSeatIndex());
        snapshot.put("status", game.getStatus().name());
        snapshot.put("undoCursor", game.getUndoCursor());
        snapshot.put("players", players.stream().map(player -> Map.of(
                "id", player.getId(),
                "alive", player.isAlive(),
                "eliminatedAt", player.getEliminatedAt() == null ? "" : player.getEliminatedAt().toString(),
                "nominated", player.isNominatedToday(),
                "votes", player.getVotesReceivedToday()
        )).toList());
        return mapToJson(snapshot);
    }

    private void applySnapshot(Game game, String json) {
        try {
            Map<String, Object> snapshot = objectMapper.readValue(json, new TypeReference<>() {});
            game.setPhase(PhaseType.valueOf((String) snapshot.get("phase")));
            game.setCurrentDayNumber((Integer) snapshot.get("day"));
            game.setSpeakerSeatIndex((Integer) snapshot.get("speaker"));
            game.setStatus(GameStatus.valueOf((String) snapshot.get("status")));
            game.setUndoCursor((Integer) snapshot.get("undoCursor"));
            List<Player> players = playerRepository.findByGameIdOrderBySeatIndexAsc(game.getId());
            Map<Long, Player> byId = players.stream().collect(Collectors.toMap(Player::getId, Function.identity()));
            List<Map<String, Object>> playerSnapshot = objectMapper.convertValue(snapshot.get("players"), new TypeReference<>() {});
            for (Map<String, Object> item : playerSnapshot) {
                Long id = ((Number) item.get("id")).longValue();
                Player player = byId.get(id);
                if (player == null) continue;
                player.setAlive(Boolean.TRUE.equals(item.get("alive")));
                String eliminatedAt = (String) item.get("eliminatedAt");
                player.setEliminatedAt(eliminatedAt == null || eliminatedAt.isBlank() ? null : Instant.parse(eliminatedAt));
                player.setNominatedToday(Boolean.TRUE.equals(item.get("nominated")));
                player.setVotesReceivedToday((Integer) item.get("votes"));
            }
            playerRepository.saveAll(players);
        } catch (Exception e) {
            throw new BadRequestException("Не удалось применить undo snapshot");
        }
    }

    private String mapToJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Failed to serialize payload");
        }
    }

    private Player getPlayerBySeat(List<Player> players, Integer seatIndex) {
        return players.stream().filter(player -> player.getSeatIndex().equals(seatIndex)).findFirst()
                .orElseThrow(() -> new BadRequestException("Игрок с местом " + seatIndex + " не найден"));
    }

    private boolean wasSavedByDoctorLastNight(Long gameId, Integer seatIndex) {
        return gameLogRepository.findByGameIdOrderBySequenceNoAsc(gameId).stream()
                .filter(log -> log.getEventType() == EventType.NIGHT_RESULT)
                .max(Comparator.comparingInt(GameLog::getSequenceNo))
                .map(GameLog::getPayloadJson)
                .filter(payload -> payload != null && !payload.isBlank())
                .map(payload -> {
                    try {
                        Map<String, Object> map = objectMapper.readValue(payload, new TypeReference<>() {});
                        Object savedSeat = map.get("doctorSaveSeat");
                        return savedSeat instanceof Number && ((Number) savedSeat).intValue() == seatIndex;
                    } catch (Exception e) {
                        return false;
                    }
                }).orElse(false);
    }

    private void setNextAliveSpeaker(Game game, List<Player> players) {
        List<Player> alivePlayers = players.stream().filter(Player::isAlive).toList();
        if (alivePlayers.isEmpty()) {
            game.setSpeakerSeatIndex(null);
            return;
        }
        Integer current = game.getSpeakerSeatIndex() == null ? alivePlayers.getFirst().getSeatIndex() : game.getSpeakerSeatIndex();
        Integer next = alivePlayers.stream().map(Player::getSeatIndex).filter(seat -> seat > current).min(Integer::compareTo)
                .orElse(alivePlayers.getFirst().getSeatIndex());
        game.setSpeakerSeatIndex(next);
    }

    private void checkWinner(Game game, List<Player> players) {
        if (game.getStatus() != GameStatus.ACTIVE) return;
        long mafiaAlive = players.stream().filter(Player::isAlive)
                .filter(player -> player.getRole() == PlayerRole.MAFIA || player.getRole() == PlayerRole.DON).count();
        long maniacAlive = players.stream().filter(Player::isAlive).filter(player -> player.getRole() == PlayerRole.MANIAC).count();
        long civiliansAlive = players.stream().filter(Player::isAlive)
                .filter(player -> player.getRole() != PlayerRole.MAFIA && player.getRole() != PlayerRole.DON && player.getRole() != PlayerRole.MANIAC).count();
        long totalAlive = players.stream().filter(Player::isAlive).count();

        WinnerSide winner = null;
        if (mafiaAlive == 0 && maniacAlive == 0) winner = WinnerSide.CIVILIANS;
        else if (mafiaAlive >= civiliansAlive && mafiaAlive > 0) winner = WinnerSide.MAFIA;
        else if (maniacAlive > 0 && totalAlive == 1) winner = WinnerSide.MANIAC;

        if (winner == null) return;
        game.setStatus(GameStatus.FINISHED);
        GameResult result = gameResultRepository.findByGameId(game.getId()).orElseGet(GameResult::new);
        result.setGame(game);
        result.setWinnerSide(winner);
        result.setTotalDays(game.getCurrentDayNumber());
        result.setSummary("Победа стороны: " + winner);
        result.setExportText("Игра #" + game.getId() + " завершена. Победитель: " + winner + ". День: " + game.getCurrentDayNumber());
        gameResultRepository.save(result);
        appendLog(game, EventType.GAME_FINISHED, "Игра завершена. Победитель: " + winner);
    }

    private PlayerResponse mapPlayer(Player player) {
        return new PlayerResponse(player.getId(), player.getSeatIndex(), player.getName(), player.getRole(), player.getCustomRoleName(),
                player.isAlive(), player.isNominatedToday(), player.getVotesReceivedToday(), player.getEliminatedAt());
    }

    private GameLogResponse mapLog(GameLog log) {
        return new GameLogResponse(log.getId(), log.getSequenceNo(), log.getEventType(), log.getMessage(), log.getPayloadJson(),
                log.isRevertible(), log.getCreatedAt());
    }

    private GameResultResponse mapResult(GameResult result) {
        return new GameResultResponse(result.getId(), result.getWinnerSide(), result.getSummary(), result.getExportText(), result.getTotalDays(),
                result.getFinishedAt());
    }
}
