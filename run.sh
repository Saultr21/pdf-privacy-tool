#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo
echo "=== RedactPDF ==="
echo "Comprobando requisitos..."
echo

ask_yes() {
    # ask_yes "pregunta" → 0 si sí (por defecto), 1 si no
    local resp
    printf "  %s [S/n] " "$1"
    read -r resp || true
    case "${resp:-s}" in
        n|N|no|NO) return 1 ;;
        *)         return 0 ;;
    esac
}

# ---------- uv ----------
if ! command -v uv >/dev/null 2>&1; then
    echo "  [!] uv no está instalado."
    echo "      Es el gestor de paquetes de Python que necesita RedactPDF."
    echo
    if ! ask_yes "¿Instalar ahora?"; then
        echo "Cancelado. Más info: https://docs.astral.sh/uv/"
        exit 1
    fi
    echo
    echo "[RedactPDF] Instalando uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"
    if ! command -v uv >/dev/null 2>&1; then
        echo
        echo "[!] uv se instaló, pero todavía no está en el PATH de esta sesión."
        echo "    Cierra esta terminal, abre una NUEVA y vuelve a ejecutar ./run.sh"
        exit 0
    fi
    echo "[RedactPDF] uv instalado correctamente."
    echo
fi

# ---------- node ----------
if ! command -v node >/dev/null 2>&1; then
    echo "  [!] Node.js no está instalado."
    echo "      Necesario para compilar la interfaz web."
    echo
    if ! ask_yes "¿Instalar ahora?"; then
        echo "Cancelado. Descarga manual: https://nodejs.org/"
        exit 1
    fi
    echo
    if command -v brew >/dev/null 2>&1; then
        echo "[RedactPDF] Instalando Node con Homebrew..."
        brew install node
    elif command -v apt-get >/dev/null 2>&1; then
        echo "[RedactPDF] Instalando Node con apt-get (requiere sudo)..."
        sudo apt-get update && sudo apt-get install -y nodejs npm
    elif command -v dnf >/dev/null 2>&1; then
        echo "[RedactPDF] Instalando Node con dnf (requiere sudo)..."
        sudo dnf install -y nodejs npm
    elif command -v pacman >/dev/null 2>&1; then
        echo "[RedactPDF] Instalando Node con pacman (requiere sudo)..."
        sudo pacman -S --noconfirm nodejs npm
    else
        echo "[!] No se detectó un gestor de paquetes conocido (brew/apt/dnf/pacman)."
        echo "    Instala Node manualmente desde: https://nodejs.org/"
        exit 1
    fi
    if ! command -v node >/dev/null 2>&1; then
        echo
        echo "[!] Node se instaló, pero todavía no está en el PATH de esta sesión."
        echo "    Cierra esta terminal y vuelve a ejecutar ./run.sh"
        exit 0
    fi
    echo "[RedactPDF] Node instalado correctamente."
    echo
fi

echo "[RedactPDF] Todo listo. Arrancando aplicación..."
echo
exec uv run python scripts/launcher.py "$@"
