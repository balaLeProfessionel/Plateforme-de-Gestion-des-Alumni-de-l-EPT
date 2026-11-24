package ept.edu.sn.alumni_backend.messagerie.dto;

import java.util.List;

/** L'onglet « Communautés » : celles dont je fais partie, puis celles que je peux rejoindre. */
public record CommunautesResponse(List<ConversationResponse> miennes, List<CommunauteResponse> aDecouvrir) {}
