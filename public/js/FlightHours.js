import { supabase } from './supabase-config.js';

class FlightHours {

    // =========================
    // BUSCAR REGISTROS DO CMTE
    // =========================
    async getMyFlights(userId) {
        const { data, error } = await supabase
            .from('flight_logs')
            .select('*')
            .eq('user_id', userId)
            .order('data_voo', { ascending: false });

        if (error) throw new Error(error.message);

        return data || [];
    }

    // =========================
    // CALCULAR HORAS
    // =========================
    calcularHoras(inicial, final) {
        const horas = Number(final) - Number(inicial);

        if (horas < 0) {
            throw new Error('Horímetro final menor que o inicial');
        }

        return Number(horas.toFixed(1));
    }

    // =========================
    // REGISTRAR VOO (ADMIN)
    // =========================
    async registrarVoo({
        user_id,
        data_voo,
        horimetro_inicial,
        horimetro_final,
        foto_url
    }) {

        const horas_voadas = this.calcularHoras(
            horimetro_inicial,
            horimetro_final
        );

        const { error } = await supabase
            .from('flight_logs')
            .insert({
                user_id,
                data_voo,
                horimetro_inicial,
                horimetro_final,
                horas_voadas,
                foto_url
            });

        if (error) throw new Error(error.message);

        return horas_voadas;
    }

    // =========================
    // UPLOAD DE FOTO
    // =========================
    async uploadFoto(file, userId) {

        const fileName = `${userId}_${Date.now()}.jpg`;

        const { data, error } = await supabase.storage
            .from('flight-photos')
            .upload(fileName, file);

        if (error) throw new Error(error.message);

        const { data: publicUrl } = supabase.storage
            .from('flight-photos')
            .getPublicUrl(fileName);

        return publicUrl.publicUrl;
    }

    // =========================
    // RESUMO DO DIA
    // =========================
    async getResumoDia(userId, data) {

        const { data: registros, error } = await supabase
            .from('flight_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('data_voo', data);

        if (error) throw new Error(error.message);

        let total = 0;

        registros.forEach(r => {
            total += Number(r.horas_voadas || 0);
        });

        return {
            total_horas: total,
            registros: registros
        };
    }

    // =========================
    // DIAS CONSECUTIVOS VOADOS
    // =========================
    async getDiasConsecutivos(userId) {

        const { data, error } = await supabase
            .from('flight_logs')
            .select('data_voo')
            .eq('user_id', userId)
            .order('data_voo', { ascending: false });

        if (error) throw new Error(error.message);

        let consecutivos = 0;
        let dataAtual = new Date();

        for (let i = 0; i < data.length; i++) {
            const vooData = new Date(data[i].data_voo);

            const diff = Math.floor(
                (dataAtual - vooData) / (1000 * 60 * 60 * 24)
            );

            if (diff === i) {
                consecutivos++;
            } else {
                break;
            }
        }

        return consecutivos;
    }

    // =========================
    // PREVISÃO DE HORAS
    // =========================
    preverHoras(mediaDiaria, diasRestantes) {
        return Number((mediaDiaria * diasRestantes).toFixed(1));
    }

}

export default new FlightHours();
