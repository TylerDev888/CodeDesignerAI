include "Resources\include_test.cds"

/*
Codes Designer Source
Credit: Cronotrigga
Patch: r0001
Force Demolition
*/

setreg a0, $000F0000
mem[0x0100] a0 = 0x0001

setreg t0, $0000D0000
address $200c0000
string "This is a test"

address $200a0000
__Demolition:
addiu sp, sp, $FFD0
sw ra, $0000(sp)
sw s0, $0004(sp)

//set the map type to Demolition
setreg v0, $00c49784
setreg t1, $03010200
sw t1, $003c(v0)

//check seal pointer
//this tells us if we are in game
setreg v0, $00440c38
lw v0, $0000(v0)
beq v0, zero, :__MPBOMB_END
nop

//set MPBOMB Spawn Coords
setreg t0, $4434C8BE
setreg t1, $42C80200
setreg t2, $446F99A2
setreg v0, $004413b4
sw t0, $0000(v0)
sw t1, $0004(v0)
sw t2, $0008(v0)

//remove the MPBOMB
//jal $002c2590
nop

//spawn the MPBOMB
jal $002c1a80
nop

//spawn the MPBOMB Indicator
jal $002c2260
nop

__MPBOMB_END:
lw ra, $0000(sp)
lw s0, $0004(sp)
jr ra
addiu sp, sp, $0030


address $D044F15C 
hexcode $0000F3FF
address $202CED04
j :__Demolition


address $D044F15C 
hexcode $0000FFFF
address $202CED04
jr ra
nop

//debug codes
address $20694d48 
hexcode $00010000

address $20c49788
hexcode $ffffffff