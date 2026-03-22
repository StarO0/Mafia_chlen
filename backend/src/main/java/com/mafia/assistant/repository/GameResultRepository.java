package com.mafia.assistant.repository;

import com.mafia.assistant.domain.GameResult;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameResultRepository extends JpaRepository<GameResult, Long> {
    Optional<GameResult> findByGameId(Long gameId);
}
