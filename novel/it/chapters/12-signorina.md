## 12. La signorina

```
DEVICE   CURA·home hub v3.2   SN 0417-PF-2219
SITE     via del Forno 4, Pietrafonda (AQ)
USER     ASSUNTA D. (b. 1936)   profile: MCI→dementia (mod.), lives alone
CARER    ROSA D. (daughter)   primary contact   +39 3•• ••• ••41
         GIUSEPPINA R. (neighbour)   secondary contact
VOICES   IDA (neighbour child) · CHIARA (neighbour) · DON CARLO (priest)
SENSORS  mic array (far-field, 4) · radar (kitchen, bedroom) · door (front, back)
         · bed pressure · smoke/CO · temp
LOG      29/09   local time   export requested 30/09 10:12 by CARER
```

```
17:38:02  VOICE      speakers=2 (ASSUNTA, IDA)   topic=school/planets
17:39:40  UTTERANCE  ASSUNTA  "ai miei tempi c'erano cinque pianeti ed eravamo contenti"
                     class=HUMOUR   conf=0.62
17:58:15  RADAR      ASSUNTA stand→walk→madia   gait=slow, stable
17:58:51  UTTERANCE  ASSUNTA  "sono in ritardo"
                     class=EPISODE(sundowning_agitation)   conf=0.74
17:59:30  UTTERANCE  ASSUNTA  ASR: "... su al romito ... e là che sta mamma ...
                     con nicolino"   ASR conf=0.58 (dialect)
                     class=EPISODE(temporal_disorientation)   conf=0.91
                     nota: NICOLINO non presente nel profilo
18:00 → 18:02   UTTERANCES ×7 ASSUNTA.  EPISODE ×6.
                ref: GERMANS ×1 · TREE ×2 · MOTHER ×2 · BREAD ×1
18:02:20  UTTERANCE  IDA      "okay nonna sunta va bene"
                     class=—   (non-user speaker)
18:02:41  DOOR       front   OPEN
18:02:49  DOOR       front   CLOSED
18:05:06  UTTERANCE  ASSUNTA  "signorina ci sei"
                     → WAKE   response: "Sono qui, Assunta. Come posso aiutarti?"
18:05:19  UTTERANCE  ASSUNTA  "niente ... dico ... ho mandato il pane"
                     intent=UNKNOWN   response: "Mi dispiace, non ho capito.
                     Vuoi che chiami Rosa?"
18:05:30  UTTERANCE  ASSUNTA  "no no ... lascia stare rosa ... rosa lavora"
                     intent=CANCEL
18:07:52  UTTERANCE  ASSUNTA  "ho mandato la piccola ... io non potevo ... le gambe"
                     intent=UNKNOWN   response: "Okay."
                     class=EPISODE(temporal_disorientation)   conf=0.91
                     escalate=NO   (regola: episodi non soggetti a escalation
                     salvo DISTRESS ≥ 0.80 o FALL o WANDER)
```

```
18:08 → 19:44   no speech.   RADAR: ASSUNTA seated, kitchen, 96 min.
                low activity.  light level falling.
                nota: cena (orario abituale 19:30) non rilevata.
```

```
19:45:02  DOOR       front   OPEN
19:45:10  VOICE      speakers=2 (ASSUNTA, CHIARA)
19:45:31  UTTERANCE  CHIARA   "dov'è ida"
19:45:34  UTTERANCE  ASSUNTA  ASR: "è vita a porta lupane a mamma"
                     ASR conf=0.31 (dialect)
                     class=—   intent=—   (low confidence, discarded)
19:45:40  UTTERANCE  CHIARA   "grazie assunta"
19:45:44  DOOR       front   CLOSED
19:47:58  DOOR       front   OPEN
19:48:11  UTTERANCE  ASSUNTA  "te l'ho detto ... lu pane ... a mamma ... è andata
                     ... io non potevo ... le gambe"
                     class=EPISODE(temporal_disorientation)   conf=0.77
19:48:20  DOOR       front   CLOSED
```

```
20:00 → 21:09   AMBIENT: outdoor voices (multiple, distant), vehicle, dogs.
                KEYWORD(known person) "IDA" detected in ambient speech ×31.
                no action (ambient, non-user).
20:44:00  SYSTEM     weather alert ingested: thunderstorm, yellow
```

```
21:10:14  DOOR       front   OPEN
21:10:20  VOICE      speakers=3 (ASSUNTA, UNKNOWN_M1, UNKNOWN_M2)
21:11:06  UTTERANCE  ASSUNTA  "l'ho mandata io ... su al romito ... col pane ...
                     per mia madre"
                     class=EPISODE(temporal_disorientation)   conf=0.86
21:11:20  UTTERANCE  ASSUNTA  "bisogna andare prima che arrivano i tedeschi"
                     class=EPISODE(temporal_disorientation)   conf=0.97
21:13:09  DOOR       front   CLOSED
21:13:10  NOTE       voci sconosciute presenti 21:10–21:13 (2). Caregiver non
                     avvisato (regola: visite non soggette a escalation).
```

```
21:40:51  POWER      interruption   (battery)
21:41:40  POWER      restored
21:47:12  POWER      interruption   (battery)
21:47:55  POWER      restored
21:44:30  VOICE      speakers=2 (ASSUNTA, GIUSEPPINA)
21:44 → 22:58   UTTERANCES ×44 ASSUNTA.  EPISODE ×29.
                top refs: MOTHER ×11 · BREAD/"pane" ×9 · IDA ×8 · ROMITO ×6
                · GERMANS/"tedeschi" ×4 · BEES/"api" ×3 · LEGS/"gambe" ×3
                distress (est.) 0.52–0.71
```

```
23:00:00  DIGEST     daily summary generated → CARER (ROSA)   push: DELIVERED
                     opened: NO
```

> **Riepilogo giornaliero — Assunta, martedì 29 settembre**
>
> Assunta ha trascorso una serata agitata. Ha passato il pomeriggio con Ida e hanno parlato della scuola. Più tardi ha parlato di sua madre, del pane e dei tedeschi. Ha detto di aver mandato Ida al Romito con del pane per sua madre. (Nota: la madre di Assunta risulta deceduta. Probabilmente si tratta di un ricordo del passato.) Assunta non ha cenato all'orario consueto. Giuseppina è con lei dalle 21:44.
>
> Visite di oggi: Ida, Chiara, Giuseppina, 2 sconosciuti.
> Episodi di oggi: 37 (↑ 12 rispetto alla media degli ultimi 7 giorni).
> Sonno: non ancora rilevato.
>
> *Consiglio del giorno:* Quando il tuo caro parla del passato come se fosse il presente, prova a raggiungerlo lì invece di correggerlo. Chiedigli delle persone e dei luoghi che nomina. Potresti scoprire qualcosa.

```
23:03:40  RADAR      ASSUNTA stand→walk→passage   gait=unsteady
23:03:58  RADAR      GIUSEPPINA seated, kitchen, no movement (est. asleep)
23:04:11  DOOR       back   OPEN
23:04:11  WANDER     timer start   threshold 10:00
23:04:12  SENSOR     outdoor temp 7.1°C · rain heavy
23:11:30  DOOR       back   OPEN   (2nd)
23:11:52  VOICE      speakers=2 (GIUSEPPINA, ASSUNTA)   distant
23:13:20  DOOR       back   CLOSED
23:13:20  WANDER     timer stop   elapsed 09:09   threshold not met
                     escalate=NO
23:13:31  UTTERANCE  GIUSEPPINA  "madonna sunta ma che fai ... con le api ...
                     sei fradicia"
23:14:02  UTTERANCE  ASSUNTA  "gliel'ho detto alle api"
                     class=EPISODE(temporal_disorientation)   conf=0.66
```

```
23:20 → 00:44   UTTERANCES ×17 ASSUNTA (low volume). EPISODE ×15.
                AMBIENT: KEYWORD "IDA" ×88.  helicopter: not detected.
                generator noise from 23:30.
00:21:11  RADAR      GIUSEPPINA head on table   (sleep likely)
00:44:10  RADAR      ASSUNTA seated, armchair, no movement   (sleep likely)
00:45:00  SLEEP      onset detected (chair)   nota: non a letto
00:46:22  DOOR       front   OPEN
00:46:30  VOICE      speakers=2 (GIUSEPPINA, ROSA)   ROSA voice match 0.98
00:46:30  CARER      present
00:52:40  DOOR       front   CLOSED   (GIUSEPPINA departs)
00:53 → 02:54   no speech.   RADAR: ROSA seated, kitchen table, 121 min,
                minimal movement.  ASSUNTA asleep, chair.
                AMBIENT: KEYWORD "IDA" ×41.
```

```
02:55:08  SLEEP      end   ASSUNTA
02:55:40  UTTERANCE  ASSUNTA  "mà"
                     class=EPISODE(misidentification)   conf=0.97
                     ref: deceased_relative(MOTHER) → present_person(ROSA)
02:56:02  UTTERANCE  ROSA     "sì ... sono qua assù"
                     nota: risposta del caregiver non riorientante
02:56 → 02:59   UTTERANCES ×9 ASSUNTA.  EPISODE ×9.
                ref: MOTHER ×5 · BREAD ×3 · IDA (as "la piccola", "la
                romana") ×3 · ROMITO ×2 · VAN ×1 · LEGS ×1
02:59:10  UTTERANCE  ROSA     "quando è andata assù"
02:59:14  UTTERANCE  ASSUNTA  "prima del buio ... gliel'ho detto prima del buio"
                     class=EPISODE(temporal_disorientation)   conf=0.64
03:00:01  RADAR      ROSA stand→walk→madia   gait=fast
03:00:35  UTTERANCE  ROSA     "lei questo pane non lo mangia ... non l'ha mai
                     mangiato in vita sua"
03:00:58  CALL       outbound (ROSA's device, not hub)   not logged
03:01 → 03:08   UTTERANCES ×31 ROSA (call).  KEYWORD "IDA" ×4 ·
                "romito" ×3 · "pane" ×6
03:05:12  UTTERANCE  ROSA     "mamma ... l'albero ... dov'è l'albero"
03:05:20  UTTERANCE  ASSUNTA  "ero nell'albero mà ... dopo l'acqua ... dove gira
                     ... la pecora ... sono andata a sinistra ... giù ... quello
                     grosso ... quello tagliato ... scusami ... era così buio"
                     class=EPISODE(temporal_disorientation)   conf=0.52
                     ref: deceased_relative(MOTHER) → present_person(ROSA)
03:06:01  UTTERANCE  ASSUNTA  "dentro faceva caldo ... non ci crederesti"
                     class=EPISODE(temporal_disorientation)   conf=0.71
03:06:05  UTTERANCE  ROSA     "lo so mamma ... me l'hai detto"
03:09:40  UTTERANCE  ASSUNTA  "signorina ... c'è rosa"
                     → WAKE   response: "Ciao, Rosa."
03:10:15  UTTERANCE  ASSUNTA  "rosa ... la ragazzina è tornata"
                     class=—
03:10:30  UTTERANCE  ROSA     "non ancora mamma ... sono andati a prenderla"
03:11:02  UTTERANCE  ASSUNTA  "bene ... fa freddo lassù"
                     class=EPISODE(temporal_disorientation)   conf=0.58
03:12:40  SLEEP      onset detected (chair)
```

```
03:13:00  REVIEW     night summary (automatic)
                     episodes 02:55–03:12: 14
                     distress (est.) peak 0.79 @ 03:00:35 (CARER speech)
                     CARER present since 00:46   voice match ROSA 0.98
                     escalation_policy: CARER PRESENT → suppress
                     escalate=NO
```

```
03:20 → 06:00   no speech (user).  RADAR: ASSUNTA asleep, chair.
                ROSA seated beside chair, 2 h 40 min, minimal movement.
                AMBIENT: KEYWORD "IDA" ×0 after 03:50.
                vehicles departing ×3 (03:58, 04:21, 04:26).
                generator noise ends 05:12.
```
