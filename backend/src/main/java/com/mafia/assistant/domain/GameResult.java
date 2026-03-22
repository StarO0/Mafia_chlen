package com.mafia.assistant.domain;

import com.mafia.assistant.domain.enums.WinnerSide;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(
        name = "game_results",
        indexes = {
                @Index(name = "idx_game_results_finished_at", columnList = "finished_at")
        }
)
public class GameResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "game_id", nullable = false, unique = true)
    private Game game;

    @Enumerated(EnumType.STRING)
    @Column(name = "winner_side", nullable = false, length = 20)
    private WinnerSide winnerSide;

    @Column(name = "summary", nullable = false, length = 2000)
    private String summary;

    @Column(name = "export_text", nullable = false, length = 4000)
    private String exportText;

    @Column(name = "total_days", nullable = false)
    private Integer totalDays;

    @Column(name = "finished_at", nullable = false, updatable = false)
    private Instant finishedAt;

    @PrePersist
    void onCreate() {
        finishedAt = Instant.now();
    }

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

    public WinnerSide getWinnerSide() {
        return winnerSide;
    }

    public void setWinnerSide(WinnerSide winnerSide) {
        this.winnerSide = winnerSide;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getExportText() {
        return exportText;
    }

    public void setExportText(String exportText) {
        this.exportText = exportText;
    }

    public Integer getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(Integer totalDays) {
        this.totalDays = totalDays;
    }

    public Instant getFinishedAt() {
        return finishedAt;
    }
}
