package com.mafia.assistant.domain;

import com.mafia.assistant.domain.enums.PlayerRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

@Entity
@Table(
        name = "players",
        indexes = {
                @Index(name = "idx_players_game_id", columnList = "game_id"),
                @Index(name = "idx_players_game_alive", columnList = "game_id,alive")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_players_game_seat", columnNames = {"game_id", "seat_index"})
        }
)
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "seat_index", nullable = false)
    private Integer seatIndex;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 20)
    private PlayerRole role;

    @Column(name = "custom_role_name", length = 120)
    private String customRoleName;

    @Column(name = "alive", nullable = false)
    private boolean alive = true;

    @Column(name = "is_nominated_today", nullable = false)
    private boolean nominatedToday = false;

    @Column(name = "votes_received_today", nullable = false)
    private Integer votesReceivedToday = 0;

    @Column(name = "eliminated_at")
    private Instant eliminatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Game getGame() {
        return game;
    }

    public void setGame(Game game) {
        this.game = game;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getSeatIndex() {
        return seatIndex;
    }

    public void setSeatIndex(Integer seatIndex) {
        this.seatIndex = seatIndex;
    }

    public PlayerRole getRole() {
        return role;
    }

    public void setRole(PlayerRole role) {
        this.role = role;
    }

    public String getCustomRoleName() {
        return customRoleName;
    }

    public void setCustomRoleName(String customRoleName) {
        this.customRoleName = customRoleName;
    }

    public boolean isAlive() {
        return alive;
    }

    public void setAlive(boolean alive) {
        this.alive = alive;
    }

    public boolean isNominatedToday() {
        return nominatedToday;
    }

    public void setNominatedToday(boolean nominatedToday) {
        this.nominatedToday = nominatedToday;
    }

    public Integer getVotesReceivedToday() {
        return votesReceivedToday;
    }

    public void setVotesReceivedToday(Integer votesReceivedToday) {
        this.votesReceivedToday = votesReceivedToday;
    }

    public Instant getEliminatedAt() {
        return eliminatedAt;
    }

    public void setEliminatedAt(Instant eliminatedAt) {
        this.eliminatedAt = eliminatedAt;
    }
}
