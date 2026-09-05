const { AttachmentBuilder } = require("discord.js");

/**
 * Genera una transcripción completa de un ticket.
 *
 * @param {import("discord.js").TextChannel} channel
 * @param {Object} ticket
 * @returns {Promise<AttachmentBuilder>}
 */
async function generateTranscript(channel, ticket = {}) {
    const messages = [];
    let lastId = null;

    // ==========================================
    // OBTENER TODOS LOS MENSAJES
    // ==========================================

    while (true) {
        const options = {
            limit: 100
        };

        if (lastId) {
            options.before = lastId;
        }

        const batch = await channel.messages
            .fetch(options)
            .catch(() => null);

        if (!batch || batch.size === 0) {
            break;
        }

        messages.push(...batch.values());

        lastId = batch.last().id;

        if (batch.size < 100) {
            break;
        }
    }

    // Ordenar del más antiguo al más reciente
    messages.sort(
        (a, b) => a.createdTimestamp - b.createdTimestamp
    );

    // ==========================================
    // CABECERA
    // ==========================================

    const lines = [];

    lines.push("==============================================");
    lines.push("           DICA STUDIO • DICA GUARD");
    lines.push("              TRANSCRIPCIÓN");
    lines.push("==============================================");
    lines.push("");

    lines.push(`Canal: ${channel.name}`);
    lines.push(`ID del canal: ${channel.id}`);

    if (ticket.userId) {
        lines.push(`Usuario: ${ticket.userId}`);
    }

    if (ticket.categoryName) {
        lines.push(`Categoría: ${ticket.categoryName}`);
    }

    if (ticket.claimedBy) {
        lines.push(`Staff asignado: ${ticket.claimedBy}`);
    }

    if (ticket.createdAt) {
        lines.push(
            `Creado: ${new Date(
                ticket.createdAt
            ).toLocaleString("es-CO")}`
        );
    }

    lines.push(
        `Cerrado: ${new Date().toLocaleString("es-CO")}`
    );

    lines.push("");
    lines.push("==============================================");
    lines.push("                 MENSAJES");
    lines.push("==============================================");
    lines.push("");

    // ==========================================
    // MENSAJES
    // ==========================================

    for (const message of messages) {
        const date = new Date(
            message.createdTimestamp
        ).toLocaleString("es-CO");

        const username =
            message.author?.username ||
            "Usuario desconocido";

        const userId =
            message.author?.id ||
            "Desconocido";

        lines.push(
            `[${date}] ${username} (${userId})`
        );

        // Texto
        if (message.content?.trim()) {
            lines.push(message.content);
        } else {
            lines.push("[Sin contenido de texto]");
        }

        // ======================================
        // ADJUNTOS
        // ======================================

        if (message.attachments?.size > 0) {
            lines.push("");
            lines.push("📎 ADJUNTOS:");

            for (const attachment of message.attachments.values()) {
                lines.push(
                    `- ${attachment.name || "Archivo"}`
                );

                lines.push(
                    `  ${attachment.url}`
                );
            }
        }

        // ======================================
        // EMBEDS
        // ======================================

        if (message.embeds?.length > 0) {
            lines.push("");
            lines.push(
                `📦 EMBEDS: ${message.embeds.length}`
            );

            for (const embed of message.embeds) {
                if (embed.title) {
                    lines.push(
                        `Título: ${embed.title}`
                    );
                }

                if (embed.description) {
                    lines.push(
                        `Descripción: ${embed.description}`
                    );
                }
            }
        }

        lines.push("");
        lines.push("----------------------------------------------");
        lines.push("");
    }

    // ==========================================
    // FINAL
    // ==========================================

    lines.push("==============================================");
    lines.push("          FIN DE LA TRANSCRIPCIÓN");
    lines.push("==============================================");
    lines.push("");
    lines.push("Generado automáticamente por DICA Guard.");
    lines.push("DICA STUDIO");

    const content = lines.join("\n");

    // ==========================================
    // NOMBRE DEL ARCHIVO
    // ==========================================

    const safeChannelName =
        channel.name
            .replace(/[^a-zA-Z0-9-_]/g, "-")
            .slice(0, 50);

    const filename =
        `transcript-${safeChannelName}-${Date.now()}.txt`;

    // ==========================================
    // CREAR ARCHIVO
    // ==========================================

    return new AttachmentBuilder(
        Buffer.from(content, "utf8"),
        {
            name: filename
        }
    );
}

module.exports = {
    generateTranscript
};
