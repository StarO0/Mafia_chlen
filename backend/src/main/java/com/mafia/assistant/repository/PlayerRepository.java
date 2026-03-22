package com.mafia.assistant.repository;

import com.mafia.assistant.domain.Player;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByGameIdOrderBySeatIndexAsc(Long gameId);
}
