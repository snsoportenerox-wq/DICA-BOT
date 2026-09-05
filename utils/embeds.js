const {
    EmbedBuilder
} = require("discord.js");

// ==========================================
// COLORES
// ==========================================

const COLORS = {
    DEFAULT: 0x5865F2,
    SUCCESS: 0x57F287,
    ERROR: 0xED4245,
    WARNING: 0xFEE75C,
    INFO: 0x5865F2,
    DARK: 0x2B2D31
};

// ==========================================
// EMBED BASE
// ==========================================

function baseEmbed() {
    return new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTimestamp()
        .setFooter({
            text: "DICA Guard • DICA STUDIO"
        });
}

// ==========================================
// ÉXITO
// ==========================================

function successEmbed(title, description) {
    return baseEmbed()
        .setColor(COLORS.SUCCESS)
        .setTitle(`✅ ${title}`)
        .setDescription(description);
}

// ==========================================
// ERROR
// ==========================================

function errorEmbed(title, description) {
    return baseEmbed()
        .setColor(COLORS.ERROR)
        .setTitle(`❌ ${title}`)
        .setDescription(description);
}

// ==========================================
// ADVERTENCIA
// ==========================================

function warningEmbed(title, description) {
    return baseEmbed()
        .setColor(COLORS.WARNING)
        .setTitle(`⚠️ ${title}`)
        .setDescription(description);
}

// ==========================================
// INFORMACIÓN
// ==========================================

function infoEmbed(title, description) {
    return baseEmbed()
        .setColor(COLORS.INFO)
        .setTitle(`ℹ️ ${title}`)
        .setDescription(description);
}

// ==========================================
// TICKET
// ==========================================

function ticketEmbed(title, description) {
    return baseEmbed()
        .setTitle(title)
        .setDescription(description);
}

// ==========================================
// SEGURIDAD
// ==========================================

function securityEmbed(title, description) {
    return baseEmbed()
        .setColor(COLORS.ERROR)
        .setTitle(`🛡️ ${title}`)
        .setDescription(description);
}

// ==========================================
// MODERACIÓN
// ==========================================

function moderationEmbed(title, description) {
    return baseEmbed()
        .setColor(COLORS.WARNING)
        .setTitle(`🔨 ${title}`)
        .setDescription(description);
}

// ==========================================
// LOG
// ==========================================

function logEmbed(title, description, color = COLORS.INFO) {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp()
        .setFooter({
            text: "DICA Guard • Logs"
        });
}

// ==========================================
// SERVER INFO
// ==========================================

function serverInfoEmbed(guild) {
    return baseEmbed()
        .setColor(COLORS.INFO)
        .setTitle(`🌐 ${guild.name}`)
        .setThumbnail(
            guild.iconURL({
                dynamic: true,
                size: 256
            })
        )
        .addFields(
            {
                name: "👑 Propietario",
                value: `<@${guild.ownerId}>`,
                inline: true
            },
            {
                name: "👥 Miembros",
                value: `${guild.memberCount}`,
                inline: true
            },
            {
                name: "🎭 Roles",
                value: `${guild.roles.cache.size}`,
                inline: true
            },
            {
                name: "💬 Canales",
                value: `${guild.channels.cache.size}`,
                inline: true
            },
            {
                name: "🚀 Boosts",
                value: `${guild.premiumSubscriptionCount || 0}`,
                inline: true
            },
            {
                name: "🛡️ Seguridad",
                value: "DICA Guard activo",
                inline: true
            },
            {
                name: "📅 Creado",
                value: `<t:${Math.floor(
                    guild.createdTimestamp / 1000
                )}:F>`,
                inline: false
            }
        );
}

// ==========================================
// MODERACIÓN
// ==========================================

function moderationLog({
    action,
    moderator,
    target,
    reason
}) {
    return logEmbed(
        `🔨 ${action}`,
        [
            `👮 **Moderador:** <@${moderator}>`,
            `👤 **Usuario:** <@${target}>`,
            `📝 **Razón:** ${reason || "No especificada"}`
        ].join("\n"),
        COLORS.WARNING
    );
}

// ==========================================
// SEGURIDAD
// ==========================================

function securityLog({
    action,
    user,
    details
}) {
    return logEmbed(
        `🛡️ ${action}`,
        [
            `👤 **Usuario:** <@${user}>`,
            `📋 **Detalles:** ${details || "Sin detalles"}`
        ].join("\n"),
        COLORS.ERROR
    );
}

// ==========================================
// VERIFICACIÓN
// ==========================================

function verificationEmbed() {
    return new EmbedBuilder()
        .setColor(COLORS.INFO)
        .setTitle("🔐 VERIFICACIÓN")
        .setDescription(
            [
                "Verifica tu cuenta para obtener acceso al servidor.",
                "",
                "📋 **Sigue estos pasos**",
                "",
                "1. Haz clic en el botón **Verificar**.",
                "2. Revisa el MD que te enviará DICA Guard.",
                "3. Introduce correctamente el código recibido.",
                "4. Si el código es correcto, recibirás automáticamente el rol de verificado.",
                "",
                "🔒 El código es personal y temporal."
            ].join("\n")
        )
        .setFooter({
            text: "DICA STUDIO • Sistema de verificación"
        });
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    COLORS,
    baseEmbed,
    successEmbed,
    errorEmbed,
    warningEmbed,
    infoEmbed,
    ticketEmbed,
    securityEmbed,
    moderationEmbed,
    logEmbed,
    serverInfoEmbed,
    moderationLog,
    securityLog,
    verificationEmbed
};
