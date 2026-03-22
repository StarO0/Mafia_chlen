package com.mafia.assistant.repository;

import com.mafia.assistant.domain.GameLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameLogRepository extends JpaRepository<GameLog, Long> {
    List<GameLog> findByGameIdOrderBySequenceNoAsc(Long gameId);
}
