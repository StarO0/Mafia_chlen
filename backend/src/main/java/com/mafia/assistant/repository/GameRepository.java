package com.mafia.assistant.repository;

import com.mafia.assistant.domain.Game;
import com.mafia.assistant.domain.enums.GameStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameRepository extends JpaRepository<Game, Long> {
    List<Game> findTop20ByStatusOrderByCreatedAtDesc(GameStatus status);

    List<Game> findTop20ByOrderByCreatedAtDesc();
}
