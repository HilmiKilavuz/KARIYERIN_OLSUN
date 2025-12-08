# main.py
import os
os.environ['TRANSFORMERS_OFFLINE'] = '1'

from supabase_skill_analyzer import process_all_approved_cvs

def main():
    """
    Render.com üzerinde çalışacak ana fonksiyon.
    """
    print("🚀 Supabase Analiz Sistemi başlatılıyor...")
    
    try:
        # Tek bir fonksiyon çağrısı yapıyoruz
        result_message = process_all_approved_cvs()
        print("✅ " + result_message)
        return result_message
    except Exception as e:
        error_msg = f"❌ Genel hata: {e}"
        print(error_msg)
        return error_msg

# Render.com veya yerel ortamda doğrudan çalıştırılabilir
if __name__ == "__main__":
    main()