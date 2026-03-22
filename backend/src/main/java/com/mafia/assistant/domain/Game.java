package com.mafia.assistant.domain;

import com.mafia.assistant.domain.enums.GameStatus;
import com.mafia.assistant.domain.enums.PhaseType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "games")
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private GameStatus status = GameStatus.SETUP;

    @Enumerated(EnumType.STRING)
    @Column(name = "phase", nullable = false, length = 10)
    private PhaseType phase = PhaseType.NIGHT;

    @Column(name = "current_day_number", nullable = false)
    private Integer currentDayNumber = 1;

    @Column(name = "speaker_seat_index")
    private Integer speakerSeatIndex;

    @Column(name = "paper_roles_enabled", nullable = false)
    private boolean paperRolesEnabled = false;

    @Column(name = "total_players", nullable = false)
    private Integer totalPlayers;

    @Column(name = "mafia_count", nullable = false)
    private Integer mafiaCount;

    @Column(name = "don_count", nullable = false)
    private Integer donCount;

    @Column(name = "sheriff_count", nullable = false)
    private Integer sheriffCount;

    @Column(name = "citizen_count", nullable = false)
    private Integer citizenCount;

    @Column(name = "custom_roles_json", length = 4000)
    private String customRolesJson;

    @Column(name = "undo_cursor", nullable = false)
    private Integer undoCursor = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Player> players = new ArrayList<>();

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<GameLog> logs = new ArrayList<>();

    @OneToOne(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private GameResult result;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public GameStatus getStatus() {
        return status;
    }

    public void setStatus(GameStatus status) {
        this.status = status;
    }

    public PhaseType getPhase() {
        return phase;
    }

    public void setPhase(PhaseType phase) {
        this.phase = phase;
    }

    public Integer getCurrentDayNumber() {
        return currentDayNumber;
    }

    public void setCurrentDayNumber(Integer currentDayNumber) {
        this.currentDayNumber = currentDayNumber;
    }

    public Integer getSpeakerSeatIndex() {
        return speakerSeatIndex;
    }

    public void setSpeakerSeatIndex(Integer speakerSeatIndex) {
        this.speakerSeatIndex = speakerSeatIndex;
    }

    public boolean isPaperRolesEnabled() {
        return paperRolesEnabled;
    }

    public void setPaperRolesEnabled(boolean paperRolesEnabled) {
        this.paperRolesEnabled = paperRolesEnabled;
    }

    public Integer getTotalPlayers() {
        return totalPlayers;
    }

    public void setTotalPlayers(Integer totalPlayers) {
        this.totalPlayers = totalPlayers;
    }

    public Integer getMafiaCount() {
        return mafiaCount;
    }

    public void setMafiaCount(Integer mafiaCount) {
        this.mafiaCount = mafiaCount;
    }

    public Integer getDonCount() {
        return donCount;
    }

    public void setDonCount(Integer donCount) {
        this.donCount = donCount;
    }

    public Integer getSheriffCount() {
        return sheriffCount;
    }

    public void setSheriffCount(Integer sheriffCount) {
        this.sheriffCount = sheriffCount;
    }

    public Integer getCitizenCount() {
        return citizenCount;
    }

    public void setCitizenCount(Integer citizenCount) {
        this.citizenCount = citizenCount;
    }

    public String getCustomRolesJson() {
        return customRolesJson;
    }

    public void setCustomRolesJson(String customRolesJson) {
        this.customRolesJson = customRolesJson;
    }

    public Integer getUndoCursor() {
        return undoCursor;
    }

    public void setUndoCursor(Integer undoCursor) {
        this.undoCursor = undoCursor;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public List<Player> getPlayers() {
        return players;
    }

    public void setPlayers(List<Player> players) {
        this.players = players;
    }

    public List<GameLog> getLogs() {
        return logs;
    }

    public void setLogs(List<GameLog> logs) {
        this.logs = logs;
    }

    public GameResult getResult() {
        return result;
    }

    public void setResult(GameResult result) {
        this.result = result;
    }
}
