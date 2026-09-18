package com.example.shipment.shipment;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final DriverRepository driverRepository;
    private final ShipmentRepository shipmentRepository;

    private static final int PREVIEW_LENGTH = 50;
    private static final int CONVERSATION_PREVIEW_LENGTH = 60;

    @Transactional
    public MessageDto.MessageResponse sendMessage(Long senderId, MessageDto.SendMessageRequest request) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new EntityNotFoundException("Receiver not found"));

        if (sender.getId().equals(receiver.getId())) {
            throw new IllegalArgumentException("Cannot send message to yourself");
        }

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .subject(request.getSubject())
                .content(request.getContent())
                .build();
        message = messageRepository.save(message);

        return toResponse(message);
    }

    public List<MessageDto.ConversationPreview> getInbox(Long userId) {
        List<Message> received = messageRepository.findByReceiver_IdOrderByCreatedAtDesc(userId);
        List<Message> sent = messageRepository.findBySender_IdOrderByCreatedAtDesc(userId);

        Map<Long, MessageDto.ConversationPreview> conversationMap = new LinkedHashMap<>();

        for (Message m : received) {
            Long otherId = m.getSender().getId();
            if (otherId.equals(userId)) continue;
            MessageDto.ConversationPreview prev = conversationMap.get(otherId);
            if (prev == null) {
                prev = MessageDto.ConversationPreview.builder()
                        .otherUserId(otherId)
                        .otherUsername(m.getSender().getUsername())
                        .otherRole(m.getSender().getRole() != null ? m.getSender().getRole().name() : null)
                        .lastMessage(truncate(m.getContent(), CONVERSATION_PREVIEW_LENGTH))
                        .lastMessageAt(m.getCreatedAt())
                        .unreadCount(0)
                        .build();
                conversationMap.put(otherId, prev);
            }
            if (prev.getLastMessageAt() == null || !m.getCreatedAt().isBefore(prev.getLastMessageAt())) {
                prev.setLastMessage(truncate(m.getContent(), CONVERSATION_PREVIEW_LENGTH));
                prev.setLastMessageAt(m.getCreatedAt());
            }
            if (!Boolean.TRUE.equals(m.getIsRead())) {
                prev.setUnreadCount(prev.getUnreadCount() + 1);
            }
        }

        for (Message m : sent) {
            Long otherId = m.getReceiver().getId();
            if (otherId.equals(userId)) continue;
            MessageDto.ConversationPreview prev = conversationMap.get(otherId);
            if (prev == null) {
                prev = MessageDto.ConversationPreview.builder()
                        .otherUserId(otherId)
                        .otherUsername(m.getReceiver().getUsername())
                        .otherRole(m.getReceiver().getRole() != null ? m.getReceiver().getRole().name() : null)
                        .lastMessage(truncate(m.getContent(), CONVERSATION_PREVIEW_LENGTH))
                        .lastMessageAt(m.getCreatedAt())
                        .unreadCount(0)
                        .build();
                conversationMap.put(otherId, prev);
            } else if (m.getCreatedAt().isAfter(prev.getLastMessageAt())) {
                prev.setLastMessage(truncate(m.getContent(), CONVERSATION_PREVIEW_LENGTH));
                prev.setLastMessageAt(m.getCreatedAt());
            }
        }

        return conversationMap.values().stream()
                .sorted(Comparator.comparing(MessageDto.ConversationPreview::getLastMessageAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .toList();
    }

    @Transactional
    public List<MessageDto.MessageResponse> getConversation(Long currentUserId, Long otherUserId) {
        List<Message> messages = messageRepository.findConversation(currentUserId, otherUserId);

        for (Message m : messages) {
            if (m.getReceiver().getId().equals(currentUserId) && !m.getIsRead()) {
                m.setIsRead(true);
                messageRepository.save(m);
            }
        }

        return messages.stream().map(this::toResponse).toList();
    }

    @Transactional
    public MessageDto.MessageResponse markAsRead(Long messageId, Long currentUserId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("Message not found"));
        if (!message.getReceiver().getId().equals(currentUserId)) {
            throw new IllegalArgumentException("Only the receiver can mark a message as read");
        }
        message.setIsRead(true);
        message = messageRepository.save(message);
        return toResponse(message);
    }

    @Transactional
    public void deleteMessage(Long messageId, Long currentUserId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("Message not found"));
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        boolean isSender = message.getSender().getId().equals(currentUserId);
        boolean isReceiver = message.getReceiver().getId().equals(currentUserId);
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isSender && !isReceiver && !isAdmin) {
            throw new IllegalArgumentException("Only sender, receiver, or ADMIN can delete this message");
        }
        messageRepository.delete(message);
    }

    public long getUnreadCount(Long userId) {
        return messageRepository.countByReceiver_IdAndIsReadFalse(userId);
    }

    public List<MessageDto.UserSummary> getAvailableReceivers(Long currentUserId, String currentRole) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        Role role = currentUser.getRole();

        Set<Long> allowedIds = new HashSet<>();

        if (role == Role.ADMIN) {
            userRepository.findAll().stream()
                    .filter(u -> !u.getId().equals(currentUserId))
                    .forEach(u -> allowedIds.add(u.getId()));
        } else if (role == Role.CUSTOMER) {
            allowedIds.addAll(getAdminUserIds());
            List<Shipment> myShipments = shipmentRepository.findByCustomerUserId(currentUserId);
            for (Shipment s : myShipments) {
                if (s.getDriver() != null && s.getDriver().getUser() != null) {
                    allowedIds.add(s.getDriver().getUser().getId());
                }
            }
        } else if (role == Role.DRIVER) {
            allowedIds.addAll(getAdminUserIds());
            List<Shipment> myShipments = shipmentRepository.findByDriverUserId(currentUserId);
            for (Shipment s : myShipments) {
                if (s.getCustomer() != null && s.getCustomer().getUser() != null) {
                    allowedIds.add(s.getCustomer().getUser().getId());
                }
            }
        }

        return allowedIds.stream()
                .map(id -> userRepository.findById(id).orElse(null))
                .filter(Objects::nonNull)
                .map(u -> MessageDto.UserSummary.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .role(u.getRole() != null ? u.getRole().name() : null)
                        .build())
                .sorted(Comparator.comparing(MessageDto.UserSummary::getUsername))
                .toList();
    }

    private List<Long> getAdminUserIds() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN)
                .map(User::getId)
                .toList();
    }

    private MessageDto.MessageResponse toResponse(Message message) {
        return MessageDto.MessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSender() != null ? message.getSender().getId() : null)
                .senderUsername(message.getSender() != null ? message.getSender().getUsername() : null)
                .senderRole(message.getSender() != null && message.getSender().getRole() != null
                        ? message.getSender().getRole().name() : null)
                .receiverId(message.getReceiver() != null ? message.getReceiver().getId() : null)
                .receiverUsername(message.getReceiver() != null ? message.getReceiver().getUsername() : null)
                .receiverRole(message.getReceiver() != null && message.getReceiver().getRole() != null
                        ? message.getReceiver().getRole().name() : null)
                .subject(message.getSubject())
                .content(message.getContent())
                .isRead(message.getIsRead())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private static String truncate(String s, int maxLen) {
        if (s == null) return "";
        return s.length() > maxLen ? s.substring(0, maxLen) + "..." : s;
    }
}
