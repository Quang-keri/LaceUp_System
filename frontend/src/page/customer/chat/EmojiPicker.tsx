import { forwardRef } from "react";

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
    onClose: () => void;
}

// TEMPLATE MODE: Simple emoji picker without external library
// TODO: Install emoji-picker-react when needed: npm install emoji-picker-react
const EmojiPicker = forwardRef<HTMLDivElement, EmojiPickerProps>(({ onEmojiSelect }, ref) => {
    const commonEmojis = [
        '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
        '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
        '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
        '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
        '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
        '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
        '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👏',
        '🙌', '👐', '🤲', '🤝', '🙏', '💪', '❤️', '💛',
        '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️'
    ];

    return (
        <div
            ref={ref}
            className={`absolute bottom-12 left-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-64 max-h-64 overflow-y-auto`}
        >
            <div className="grid grid-cols-8 gap-2">
                {commonEmojis.map((emoji, index) => (
                    <button
                        key={index}
                        onClick={() => onEmojiSelect(emoji)}
                        className="text-2xl hover:bg-[#4da6ff]/10 rounded p-1 transition-colors"
                        type="button"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center font-medium">
                Template Mode - Simple Emoji Picker
            </p>
        </div>
    );
});

EmojiPicker.displayName = "EmojiPicker";

export default EmojiPicker;
