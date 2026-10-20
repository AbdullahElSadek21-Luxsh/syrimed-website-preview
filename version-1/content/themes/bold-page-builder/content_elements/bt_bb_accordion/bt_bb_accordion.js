(function( $ ) {
	"use strict";
	$( '.bt_bb_accordion_item_title_content' ).click(function() {
		if ( !$(this).closest( '.bt_bb_accordion_item' ).hasClass('on') ) {
			$( this ).closest( '.bt_bb_accordion' ).find( '.bt_bb_accordion_item.on' ).removeClass( 'on' );
			$( this ).closest( '.bt_bb_accordion_item' ).addClass( 'on' );
		
		} else {
			// $( this ).parent().removeClass( 'on' );
			$( this ).closest( '.bt_bb_accordion_item' ).removeClass( 'on' );
		
		}
	});

	$( '.bt_bb_accordion' ).each(function() {
		if ( $( this ).data( 'closed' ) != 'closed' ) {
			$( this ).find( '.bt_bb_accordion_item' ).first().click();
		}
	});
})( jQuery );