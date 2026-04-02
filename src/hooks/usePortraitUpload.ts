import { saveCharacterImage } from '@/lib/db';
import type { Character } from '@/lib/types';

export function usePortraitUpload(
  characterId: string,
  updateCharacter: (updates: Partial<Character>) => void,
) {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be smaller than 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      // Salva no store images (fonte única) e atualiza estado em memória
      await saveCharacterImage(characterId, dataUrl);
      updateCharacter({ portrait: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  return { handleUpload };
}
