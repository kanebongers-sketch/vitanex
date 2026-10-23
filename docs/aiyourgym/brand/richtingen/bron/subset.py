# Maakt kleine subsets (alleen de letters van het merk) van de OFL-letters die de
# logorichtingen gebruiken, en zet de licenties ernaast.
# Draaien vanuit de hoofdmap van de repo: python3 docs/aiyourgym/brand/richtingen/bron/subset.py
# Bron van de letters: de officiele uitgaven (Google Fonts, SIL Open Font License 1.1).
import os
import shutil
import subprocess
import sys

BRON = sys.argv[1] if len(sys.argv) > 1 else '/mnt/skills/examples/canvas-design/canvas-fonts'
HIER = os.path.dirname(os.path.abspath(__file__))
TEKST = 'AI Your GymAIYOURGYMCLUBSOFTWAREVOORSPORTSCHOLENaiyourgmclubsoftwarevp.0123456789 '

for naam in ['InstrumentSans', 'Outfit', 'BigShoulders', 'BricolageGrotesque']:
    subprocess.run([
        'pyftsubset', os.path.join(BRON, f'{naam}-Bold.ttf'), f'--text={TEKST}',
        f'--output-file={os.path.join(HIER, naam + "-Bold-merk.ttf")}',
        '--layout-features=kern', '--no-hinting',
    ], check=True)
    shutil.copy(os.path.join(BRON, f'{naam}-OFL.txt'), os.path.join(HIER, f'OFL-{naam}.txt'))
print('klaar')
