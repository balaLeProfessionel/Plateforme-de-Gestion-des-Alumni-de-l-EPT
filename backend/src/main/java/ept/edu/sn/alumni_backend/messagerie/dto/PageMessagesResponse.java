package ept.edu.sn.alumni_backend.messagerie.dto;

import java.util.List;

/** Messages du plus ancien au plus récent ; {@code plusAnciens} : il en reste avant le premier. */
public record PageMessagesResponse(List<MessageResponse> messages, boolean plusAnciens) {}
