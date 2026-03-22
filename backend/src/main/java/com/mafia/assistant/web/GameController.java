package com.mafia.assistant.web;

import com.mafia.assistant.service.GameService;
import com.mafia.assistant.web.dto.AssignRolesRequest;
import com.mafia.assistant.web.dto.CreateGameRequest;
import com.mafia.assistant.web.dto.GameLogResponse;
import com.mafia.assistant.web.dto.GameResponse;
import com.mafia.assistant.web.dto.GameResultResponse;
import com.mafia.assistant.web.dto.GameSummaryResponse;
import com.mafia.assistant.web.dto.NightResolutionRequest;
import com.mafia.assistant.web.dto.PlayerActionRequest;
import com.mafia.assistant.web.dto.UpdateRolesRequest;
import com.mafia.assistant.web.dto.VoteCastRequest;
import com.mafia.assistant.web.dto.VoteNominationRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping("/history")
    public List<GameSummaryResponse> getHistory() {
        return gameService.getHistory();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GameResponse createGame(@Valid @RequestBody CreateGameRequest request) {
        return gameService.createGame(request);
    }

    @GetMapping("/{gameId}")
    public GameResponse getGame(@PathVariable Long gameId) {
        return gameService.getGame(gameId);
    }

    @PatchMapping("/{gameId}/roles")
    public GameResponse updateRoles(@PathVariable Long gameId, @Valid @RequestBody UpdateRolesRequest request) {
        return gameService.updateRoles(gameId, request);
    }

    @PostMapping("/{gameId}/assignments")
    public GameResponse assignRoles(@PathVariable Long gameId, @Valid @RequestBody AssignRolesRequest request) {
        return gameService.assignRoles(gameId, request);
    }

    @PostMapping("/{gameId}/start")
    public GameResponse startGame(@PathVariable Long gameId) {
        return gameService.startGame(gameId);
    }

    @GetMapping("/{gameId}/logs")
    public List<GameLogResponse> getLogs(@PathVariable Long gameId) {
        return gameService.getGameLogs(gameId);
    }

    @GetMapping("/{gameId}/result")
    public GameResultResponse getResult(@PathVariable Long gameId) {
        return gameService.getGameResult(gameId);
    }

    @PostMapping("/{gameId}/phase/toggle")
    public GameResponse togglePhase(@PathVariable Long gameId) {
        return gameService.togglePhase(gameId);
    }

    @PostMapping("/{gameId}/undo")
    public GameResponse undo(@PathVariable Long gameId) {
        return gameService.undoLastAction(gameId);
    }

    @PostMapping("/{gameId}/speaker/next")
    public GameResponse nextSpeaker(@PathVariable Long gameId) {
        return gameService.nextSpeaker(gameId);
    }

    @PostMapping("/{gameId}/players/{seatIndex}/eliminate")
    public GameResponse eliminatePlayer(
            @PathVariable Long gameId,
            @PathVariable Integer seatIndex,
            @RequestBody(required = false) PlayerActionRequest request
    ) {
        return gameService.eliminatePlayer(gameId, seatIndex, request);
    }

    @PostMapping("/{gameId}/players/{seatIndex}/restore")
    public GameResponse restorePlayer(@PathVariable Long gameId, @PathVariable Integer seatIndex) {
        return gameService.restorePlayer(gameId, seatIndex);
    }

    @PostMapping("/{gameId}/votes/nominate")
    public GameResponse nominate(@PathVariable Long gameId, @Valid @RequestBody VoteNominationRequest request) {
        return gameService.nominateForVote(gameId, request);
    }

    @PostMapping("/{gameId}/votes/cast")
    public GameResponse castVote(@PathVariable Long gameId, @Valid @RequestBody VoteCastRequest request) {
        return gameService.castVote(gameId, request);
    }

    @PostMapping("/{gameId}/votes/reset")
    public GameResponse resetVotes(@PathVariable Long gameId) {
        return gameService.resetVoting(gameId);
    }

    @PostMapping("/{gameId}/night/resolve")
    public GameResponse resolveNight(@PathVariable Long gameId, @Valid @RequestBody NightResolutionRequest request) {
        return gameService.resolveNight(gameId, request);
    }
}
