package com.example.shipment.shipment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByReceiver_IdOrderByCreatedAtDesc(Long receiverId);

    List<Message> findBySender_IdOrderByCreatedAtDesc(Long senderId);

    List<Message> findByReceiver_IdAndSender_IdOrderByCreatedAtDesc(Long receiverId, Long senderId);

    long countByReceiver_IdAndIsReadFalse(Long receiverId);

    @Query("SELECT m FROM Message m WHERE " +
            "(m.sender.id = :userAId AND m.receiver.id = :userBId) OR " +
            "(m.sender.id = :userBId AND m.receiver.id = :userAId) " +
            "ORDER BY m.createdAt ASC")
    List<Message> findConversation(@Param("userAId") Long userAId, @Param("userBId") Long userBId);
}
