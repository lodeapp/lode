<template>
    <Modal
        :dismissable="false"
        title="Preferences"
    >
        <form class="preferences" @submit.prevent>
            <div class="form-group">
                <dl>
                    <dt><label for="project-name">Concurrent process limit:</label></dt>
                    <dd>
                        <div class="form-help">Decrease if you experience slow performance.</div>
                        <select class="form-control form-select input-sm" v-model="concurrency">
                            <option>1</option>
                            <option>2</option>
                            <option>3</option>
                            <option>4</option>
                            <option>5</option>
                        </select>
                    </dd>
                </dl>
            </div>
        </form>
        <div slot="footer" class="modal-footer tertiary flex-justify-end">
            <button type="button" class="btn btn-sm btn-primary" @click="$emit('hide')">
                Done
            </button>
        </div>
    </Modal>
</template>

<script>
import { Config } from '@lib/config'
import Modal from '@/components/modals/Modal'

export default {
    name: 'Preferences',
    components: {
        Modal
    },
    computed: {
        concurrency: {
            get () {
                return Config.get('concurrency')
            },
            set (value) {
                return Config.set('concurrency', value)
            }
        }
    }
}
</script>
